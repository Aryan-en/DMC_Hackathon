FROM python:3.11-slim

WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    postgresql-client \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip with retries
RUN pip install --no-cache-dir --upgrade pip setuptools wheel || pip install --no-cache-dir --retries 3 --upgrade pip setuptools wheel

# Copy ONLY requirements and install (better caching)
COPY requirements-docker.txt requirements.txt ./

# Install with multiple retries and longer timeout
RUN pip install --no-cache-dir --retries 5 --default-timeout=100 -r requirements-docker.txt || \
    pip install --no-cache-dir --retries 5 --default-timeout=100 -r requirements-docker.txt

# Copy application code
COPY . .

EXPOSE 8000

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
