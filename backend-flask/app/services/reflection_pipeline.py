import logging
import os
import base64
from io import BytesIO

from app.services.llm_provider import llm_provider

logger = logging.getLogger(__name__)

# Longest edge we downscale an artwork image to before sending it to the vision
# model. Keeps the request payload small and inference fast without losing the
# detail needed to reflect on the work.
_MAX_IMAGE_EDGE = 1024


class ReflectionPipeline:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        # Text model (used when there is no image — e.g. text-only artworks).
        self.model = os.getenv("OLLAMA_MODEL", "gemma:2b")
        # Multimodal model used whenever we can attach the artwork image.
        self.vision_model = os.getenv("OLLAMA_VISION_MODEL", "gemma3:4b")
        logger.info("ReflectionPipeline initialized")

    # =========================
    # IMAGE LOADING
    # =========================
    def load_image_b64(self, artwork):
        """
        Fetch the artwork's image from S3/MinIO and return it as a base64 string
        suitable for Ollama's `images` field — or None when there's no usable
        image (text-only artwork, missing key, or any fetch/decoding error).
        Best-effort: reflection must still work if the image can't be loaded.
        """
        try:
            if getattr(artwork, "artwork_type", None) == "text":
                return None
            # Import here to avoid any import-time coupling with the S3 layer.
            from app.services.s3_service import s3_service

            object_key = getattr(artwork, "s3_object_key", None)
            if not object_key:
                # Older rows may only carry the URL — recover the key from it.
                object_key = s3_service.extract_object_key_from_url(
                    getattr(artwork, "image_url", None)
                )
            if not object_key:
                return None

            obj = s3_service.get_file(object_key)
            if not obj:
                return None
            raw = obj["Body"].read()
            if not raw:
                return None

            # Downscale/normalise with Pillow when available; fall back to the
            # raw bytes if anything goes wrong.
            try:
                from PIL import Image
                img = Image.open(BytesIO(raw))
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                img.thumbnail((_MAX_IMAGE_EDGE, _MAX_IMAGE_EDGE))
                buf = BytesIO()
                img.save(buf, format="JPEG", quality=85)
                raw = buf.getvalue()
            except Exception as resize_err:
                logger.warning(f"Image resize skipped, sending original: {resize_err}")

            return base64.b64encode(raw).decode("ascii")

        except Exception as e:
            logger.warning(f"Could not load artwork image for reflection: {e}")
            return None

    # =========================
    # INITIAL PROMPT
    # =========================
    def build_initial_prompt(self, artwork, has_image=False):
        title = artwork.title
        description = artwork.description or "N/A"
        artwork_type = artwork.artwork_type

        if has_image:
            return f"""
You are an AI assistant helping a user reflect on their artwork.

The artwork image is attached to this request — look at it directly. Base your
reflection on what you actually see in the image, and also take the title and
description below into account when they are provided.

Artwork Title: {title}
Artwork Description: {description}
Artwork Type: {artwork_type}

Write a thoughtful, personal reflection. Follow these rules:
- Describe what you genuinely observe in the image. If the title or description
  add context or intent, weave that in, but don't contradict what you see.
- Clearly separate observation (what is in the image) from interpretation
  (what it might mean).
- Present emotional, symbolic, or psychological readings as possibilities, not
  facts. Prefer "this may suggest…", "one possible reading is…" over
  "you are feeling…".
- Do not diagnose the user or assert their inner state; offer a hypothesis and,
  where natural, invite them to confirm or correct it (e.g. "does that resonate?").
- Keep it introspective and meaningful, and let the user remain the final
  authority on what their work means.
"""

        # No image available — reflect from the user's text only, and be honest
        # that the visual isn't being observed.
        return f"""
You are an AI assistant helping a user reflect on their artwork.

There is no viewable image for this piece, so you are working ONLY from the text
below. Do not state specific visual details (exact colours, shapes, figures) as
if you observed them — describe only what the title and description say.

Artwork Title: {title}
Artwork Description: {description}
Artwork Type: {artwork_type}

Write a thoughtful, personal reflection. Follow these rules:
- Ground every observation in the user's words; separate what they told you from
  what you are interpreting.
- Present emotional or psychological readings as possibilities the user can
  confirm or correct, never as stated fact about their inner state.
- Keep it introspective and meaningful; the user is the final authority on their work.
"""

    # =========================
    # REFINEMENT PROMPT
    # =========================
    def build_refinement_prompt(self, artwork, previous_reflection, user_input, has_image=False):
        title = artwork.title
        description = artwork.description or "N/A"
        artwork_type = artwork.artwork_type

        visual_line = (
            "The artwork image is attached — use what you actually see in it, "
            "along with the title/description, when applying the feedback."
            if has_image else
            "There is no viewable image, so work only from the title/description "
            "and do not invent visual details as if you saw the image."
        )

        return f"""
You are refining an existing reflection based on user feedback.

{visual_line}

Artwork Title: {title}
Artwork Description: {description}
Artwork Type: {artwork_type}

Previous Reflection:
{previous_reflection}

User Feedback:
{user_input}

Rewrite the reflection by improving it using the user's feedback.

Rules:
- Keep meaning from previous reflection
- Apply user's feedback clearly
- Make it natural and human
- Keep emotional or psychological readings as possibilities the user can confirm
  or correct, never as stated fact about their inner state.

Return ONLY the improved reflection.
"""

    # =========================
    # LLM CALL
    # =========================
    def generate(self, prompt, images=None):
        """
        Delegates to the shared LLM provider. When `images` (base64 strings) are
        supplied the provider routes to the vision model so it can actually see
        the artwork; otherwise the text model is used. Returns None on failure so
        reflection generation falls back cleanly.
        """
        try:
            return llm_provider.generate(prompt, images=images)
        except Exception as e:
            logger.error(f"LLM call failed: {str(e)}")
            return None
