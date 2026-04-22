# app/services/embedding_service.py
from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def embed(self, text: str):
        return self.model.encode(text).tolist()

embedding_service = EmbeddingService()