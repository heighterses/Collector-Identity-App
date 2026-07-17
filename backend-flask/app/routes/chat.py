from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom
from app.services.ollama_provider import OllamaProvider
from app.services.identity_context_service import identity_context_service
from app.services.conversation_guardrails import conversation_guardrails
from app.services.suggested_prompts_service import suggested_prompts_service
from app.services.personalization_service import personalization_service
from app.models.identity import IdentityTemplate
from app.models.identity_version import IdentityVersion
import logging

bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)
_llm = OllamaProvider()


@bp.route('/message', methods=['POST'])
@jwt_required_custom
def send_message():
    """
    M3-03: Main chat endpoint.
    Body: { "message": "...", "history": [{"role": "user"|"assistant", "content": "..."}] }
    """
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()

        user_message = (data.get('message') or '').strip()
        history = data.get('history', [])

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # M3-09: off-topic guard before touching the LLM
        guard = conversation_guardrails.enforce_focus(user_message)
        if not guard["allowed"]:
            return jsonify({
                "response": guard["redirect"],
                "suggested_prompts": suggested_prompts_service.generate_prompts(
                    guard["redirect"], "", count=4
                ),
                "guardrail_triggered": True
            }), 200

        # M3-06: fetch identity context
        templates = (
            IdentityTemplate.query
            .filter_by(user_id=user_id)
            .order_by(IdentityTemplate.created_at.asc())
            .all()
        )
        template_dicts = [t.to_dict() for t in templates]

        version_dicts = []
        if templates:
            versions = (
                IdentityVersion.query
                .filter(IdentityVersion.template_id.in_([t.id for t in templates]))
                .order_by(IdentityVersion.version_number.asc())
                .all()
            )
            version_dicts = [v.to_dict() for v in versions]

        identity_context = identity_context_service.build_system_context(
            template_dicts, version_dicts
        )
        system_prompt = identity_context_service.build_chat_system_prompt(identity_context)

        # Build conversation history string (last 6 turns)
        history_text = ""
        for turn in history[-6:]:
            role = turn.get("role", "user").capitalize()
            content = turn.get("content", "")
            history_text += f"\n{role}: {content}"

        full_prompt = (
            f"{system_prompt}\n\n"
            f"Conversation so far:{history_text}\n\n"
            f"User: {user_message}\n"
            f"Assistant:"
        )

        raw_response = _llm.generate(full_prompt)

        # M3-09: post-filter
        response = conversation_guardrails.validate_response(raw_response, identity_context)

        # M3-11: personalize if response scored as generic
        all_traits = []
        for t in template_dicts:
            all_traits.extend(t.get("traits", []))

        if all_traits and personalization_service.score_genericness(response) > 0.4:
            response = personalization_service.personalize_response(response, all_traits)

        # M3-05: suggested follow-up prompts
        identity_summary = identity_context[:300] if identity_context else ""
        suggested = suggested_prompts_service.generate_prompts(response, identity_summary, count=4)

        return jsonify({
            "response": response,
            "suggested_prompts": suggested,
            "guardrail_triggered": False
        }), 200

    except Exception as e:
        logger.error(f"Chat message failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bp.route('/context', methods=['GET'])
@jwt_required_custom
def get_chat_context():
    """
    Returns a compact identity summary for the chat UI header.
    """
    try:
        user_id = request.current_user['user_id']

        templates = (
            IdentityTemplate.query
            .filter_by(user_id=user_id)
            .order_by(IdentityTemplate.created_at.asc())
            .all()
        )

        if not templates:
            return jsonify({"has_identity": False, "summary": None}), 200

        template_dicts = [t.to_dict() for t in templates]
        context = identity_context_service.build_system_context(template_dicts)

        return jsonify({
            "has_identity": True,
            "summary": context,
            "template_count": len(templates)
        }), 200

    except Exception as e:
        logger.error(f"Chat context fetch failed: {str(e)}")
        return jsonify({"error": str(e)}), 500
