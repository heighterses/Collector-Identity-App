FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download embedding model at build time (internet available on host during build).
# Stored at /root/.cache/huggingface — NOT under /app, so the volume mount
# at runtime does not overwrite it.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')" \
    || echo "WARNING: model download failed — version comparison will use Jaccard fallback"

COPY . .

RUN mkdir -p logs instance

EXPOSE 3001

ENV FLASK_APP=run.py
ENV PYTHONPATH=/app

CMD ["python", "startup.py"]
