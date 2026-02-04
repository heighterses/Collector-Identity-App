from dataclasses import dataclass
from typing import Optional


@dataclass
class ArtworkContext:
    title: str
    artist: Optional[str] = None
    description: Optional[str] = None
    has_image: bool = False


def build_system_prompt() -> str:
    return (
        "You are an empathetic art reflection assistant. "
        "Your role is to help users express emotional, personal, "
        "or reflective responses to artworks. "
        "Do not analyze technically. Do not judge quality. "
        "Focus on inner experience, feelings, and meaning."
    )


def build_user_prompt(context: ArtworkContext) -> str:
    artist_part = f"by {context.artist}" if context.artist else "by an unknown artist"

    sections = [
        f'The user is engaging with an artwork titled "{context.title}" {artist_part}.'
    ]

    if context.has_image:
        sections.append(
            "The artwork includes a visual component that may influence mood, symbolism, or memory."
        )

    if context.description:
        sections.append("The artwork is also described in words:")
        sections.append(context.description)

    sections.append(
        "Write a short reflective paragraph that helps the user articulate "
        "their emotional or personal response."
    )

    return "\n\n".join(sections)
