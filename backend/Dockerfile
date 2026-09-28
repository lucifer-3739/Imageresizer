FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY app.py .

ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=5m --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "app.py"]
