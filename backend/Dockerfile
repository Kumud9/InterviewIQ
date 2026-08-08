FROM python:3.13-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files into workdir
COPY backend/ /app/

# Copy curriculum and candidates data folder to the container root path expected by engine.py path resolution
COPY data/ /data/

EXPOSE 8000

# Bind to Railway's dynamically injected PORT env variable, fallback to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
