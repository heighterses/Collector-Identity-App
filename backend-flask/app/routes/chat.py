from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom
from app.services.ollama_provider import OllamaProvider
from app.services.identity_context_service import identity_context_service
from app.services.conversation_guardrails import conversation_guardrails
from app.services.suggested_prompts_service import suggested_prompts_service
from app.services.personalization_service import personalization_service
from app.models.identity import IdentityTemplate
from app.models.identity_version import IdentityVersion
from app.models.artwork import Artwork
from app.models.chat_message import ChatMessage
from app import db
from datetime import datetime
import logging

bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)
_llm = OllamaProvider()

# Chat history is paginated in pages of this size (both the default fetch and
# each "load earlier messages" page).
HISTORY_PAGE_SIZE = 50
HISTORY_PAGE_SIZE_MAX = 200


def _persist_turn(user_id, artwork_id, user_message, assistant_response):
    """
    Save one user/assistant exchange to chat_messages, scoped to
    (user_id, artwork_id). artwork_id is None for identity-level chat.
    Best-effort: a persistence failure shouldn't break the chat response
    that's already been generated.
    """
    try:
        db.session.add(ChatMessage(
            user_id=user_id, artwork_id=artwork_id, role='user', content=user_message
        ))
        db.session.add(ChatMessage(
            user_id=user_id, artwork_id=artwork_id, role='assistant', content=assistant_response
        ))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to persist chat turn: {str(e)}")


@bp.route('/message', methods=['POST'])
@jwt_required_custom
def send_message():
    """
    M3-03: Main chat endpoint.
    Body: { "message": "...", "history": [{"role": "user"|"assistant", "content": "..."}],
            "artwork_id": "..." (optional — the chat UI's currently active artwork) }
    """
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()

        user_message = (data.get('message') or '').strip()
        history = data.get('history', [])
        artwork_id = data.get('artwork_id')

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # M3-09: off-topic guard before touching the LLM
        guard = conversation_guardrails.enforce_focus(user_message)
        if not guard["allowed"]:
            _persist_turn(user_id, artwork_id, user_message, guard["redirect"])
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

        # M3-11: pull in the currently-discussed artwork's title + reflection
        # so responses can cite something concrete instead of only abstracted
        # trait labels — ownership-checked, and quietly skipped if the
        # artwork doesn't exist or isn't the user's.
        active_artwork = None
        if artwork_id:
            artwork = Artwork.query.filter_by(id=artwork_id, user_id=user_id).first()
            if artwork:
                reflection_content = artwork.reflection.content if artwork.reflection else None
                active_artwork = {
                    "title": artwork.title,
                    "reflection_excerpt": reflection_content[:300] if reflection_content else None,
                }

        identity_context = identity_context_service.build_system_context(
            template_dicts, version_dicts, active_artwork
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

        # Persist server-side so the conversation survives navigation, a
        # refresh, and re-login — scoped to this user + this artwork context
        # (or identity-level when artwork_id is None).
        _persist_turn(user_id, artwork_id, user_message, response)

        return jsonify({
            "response": response,
            "suggested_prompts": suggested,
            "guardrail_triggered": False
        }), 200

    except Exception as e:
        logger.error(f"Chat message failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bp.route('/history', methods=['GET'])
@jwt_required_custom
def get_chat_history():
    """
    Returns persisted chat history for the current user, scoped to a single
    context: a specific artwork (?artwork_id=...) or the identity-level
    conversation (artwork_id omitted). Always chronological (oldest first).

    Paginates backwards from the most recent message: without `before`, the
    most recent HISTORY_PAGE_SIZE messages are returned; pass `before` (an
    ISO-8601 timestamp — the `created_at` of the oldest message currently
    loaded) to fetch the page immediately preceding it, for "load earlier
    messages" style pagination.
    """
    try:
        user_id = request.current_user['user_id']
        artwork_id = request.args.get('artwork_id') or None

        try:
            limit = int(request.args.get('limit', HISTORY_PAGE_SIZE))
        except (TypeError, ValueError):
            limit = HISTORY_PAGE_SIZE
        limit = max(1, min(limit, HISTORY_PAGE_SIZE_MAX))

        # Ownership check: a caller can only ever read their own messages
        # (filtered by user_id below), but if an artwork_id is supplied,
        # confirm it's actually theirs so a stale/foreign id quietly returns
        # an empty thread instead of a leaked one.
        if artwork_id:
            owns_artwork = Artwork.query.filter_by(id=artwork_id, user_id=user_id).first()
            if not owns_artwork:
                return jsonify({"messages": [], "has_more": False}), 200

        query = ChatMessage.query.filter_by(user_id=user_id, artwork_id=artwork_id)

        before = request.args.get('before')
        if before:
            try:
                before_dt = datetime.fromisoformat(before)
                query = query.filter(ChatMessage.created_at < before_dt)
            except ValueError:
                pass

        # Fetch newest-first (+1 to detect an earlier page), then reverse to
        # chronological order for the response.
        rows = (
            query.order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
            .limit(limit + 1)
            .all()
        )
        has_more = len(rows) > limit
        rows = rows[:limit]
        rows.reverse()

        return jsonify({
            "messages": [m.to_dict() for m in rows],
            "has_more": has_more,
        }), 200

    except Exception as e:
        logger.error(f"Chat history fetch failed: {str(e)}")
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
