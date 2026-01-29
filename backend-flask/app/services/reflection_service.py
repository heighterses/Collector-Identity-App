import time
import asyncio
from dataclasses import dataclass
from typing import Optional
from abc import ABC, abstractmethod

@dataclass
class ArtworkContext:
    title: str
    artist: Optional[str]
    description: str

class AIProvider(ABC):
    @abstractmethod
    def generate_reflection(self, prompt: str) -> str:
        pass

class MockAIProvider(AIProvider):
    def generate_reflection(self, prompt: str) -> str:
        if "Rewrite the reflection" in prompt:
            return (
                "The artwork feels gently inviting, creating a warmer sense of calm "
                "that allows personal emotions to settle naturally and without pressure."
            )

        return (
            "The artwork offers a quiet presence, leaving room for personal feelings "
            "to emerge slowly and without needing to be clearly defined."
        )

class ReflectionService:
    """Reflection service with integrated ML pipeline"""
    
    def __init__(self):
        # Initialize AI provider (using mock for now)
        self.ai_provider = MockAIProvider()
        self.system_prompt = """
You are a reflective writing assistant helping a user express personal
feelings about an artwork.

Rules:
- Do NOT analyze or explain
- Do NOT teach or interpret
- Avoid certainty and authority
- Write a single short paragraph
- Do NOT ask questions
""".strip()
    
    def build_initial_prompt(self, context: ArtworkContext) -> str:
        artist_text = f"by {context.artist}" if context.artist else "by an unknown artist"

        return f"""
SYSTEM:
{self.system_prompt}

USER:
The user is viewing an artwork titled "{context.title}" {artist_text}.

Artwork description:
{context.description}

Write a reflective paragraph to help the user engage emotionally.
""".strip()
    
    def build_revision_prompt(self, context: ArtworkContext, previous_reflection: str, user_feedback: str) -> str:
        return f"""
SYSTEM:
{self.system_prompt}

USER:
Artwork context:
Title: {context.title}
Description: {context.description}

Previous reflection:
{previous_reflection}

User feedback:
{user_feedback}

Rewrite the reflection incorporating the user's feedback.
""".strip()
    
    def generate_reflection_pipeline(self, context: ArtworkContext, previous_reflection: Optional[str] = None, user_feedback: Optional[str] = None) -> str:
        if previous_reflection and user_feedback:
            prompt = self.build_revision_prompt(context, previous_reflection, user_feedback)
        else:
            prompt = self.build_initial_prompt(context)

        return self.ai_provider.generate_reflection(prompt)
    
    async def generate_initial_reflection(self, artwork):
        """Generate initial interpretation for artwork using ML pipeline"""
        # Simulate processing time
        await asyncio.sleep(0.5)
        
        # Create artwork context for ML pipeline
        context = ArtworkContext(
            title=artwork.title,
            artist=None,  # We don't store artist info in our model yet
            description=artwork.description or "No description provided"
        )
        
        # Generate reflection using ML pipeline
        reflection_content = self.generate_reflection_pipeline(context)
        
        return {
            'content': reflection_content,
            'type': 'initial_interpretation'
        }
    
    def generate_initial_reflection_sync(self, artwork):
        """Synchronous version for Flask routes using ML pipeline"""
        # Simulate processing time
        time.sleep(0.5)
        
        # Create artwork context for ML pipeline
        context = ArtworkContext(
            title=artwork.title,
            artist=None,  # We don't store artist info in our model yet
            description=artwork.description or "No description provided"
        )
        
        # Generate reflection using ML pipeline
        reflection_content = self.generate_reflection_pipeline(context)
        
        return {
            'content': reflection_content,
            'type': 'initial_interpretation'
        }
    
    def generate_revised_reflection(self, artwork, previous_reflection: str, user_feedback: str):
        """Generate revised reflection based on user feedback"""
        context = ArtworkContext(
            title=artwork.title,
            artist=None,
            description=artwork.description or "No description provided"
        )
        
        # Generate revised reflection using ML pipeline
        reflection_content = self.generate_reflection_pipeline(
            context, 
            previous_reflection, 
            user_feedback
        )
        
        return {
            'content': reflection_content,
            'type': 'revised_interpretation'
        }
    
    def call_ml_service(self, artwork):
        """Future ML integration point
        Replace MockAIProvider with actual ML service call
        """
        # TODO: Replace MockAIProvider with actual ML service integration
        # Example:
        # response = requests.post('https://ml-service.com/api/reflect', json={
        #     'title': artwork.title,
        #     'description': artwork.description,
        #     'image_url': artwork.image_url
        # })
        # return response.json()
        
        raise NotImplementedError('External ML service not implemented yet')

# Create singleton instance
reflection_service = ReflectionService()