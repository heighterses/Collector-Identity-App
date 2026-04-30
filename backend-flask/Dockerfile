FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create instance directory for SQLite database
RUN mkdir -p instance

# Expose port
EXPOSE 3001

# Set environment variables
ENV FLASK_APP=run.py
ENV PYTHONPATH=/app

# Startup: smart migration handler then Flask app
CMD ["python", "startup.py"]
