import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        self.model = None
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Embedding model loaded")
        except Exception as e:
            logger.warning(f"Embedding model unavailable — using Jaccard fallback: {e}")

    def embed(self, text: str):
        if self.model is None:
            return None
        return self.model.encode(text).tolist()

    @property
    def available(self):
        return self.model is not None


embedding_service = EmbeddingService()
