---
description: Start the entire Ontora platform (Backend + Frontend + Worker)
---
1. Ensure Docker Desktop is running (Postgres, Neo4j, Redis, Kafka)
// turbo
2. Update dependencies in backend:
   ```powershell
   cd backend
   pip install -r requirements.txt
   ```
// turbo
3. Start the FastAPI backend:
   ```powershell
   python main.py
   ```
// turbo
4. In a NEW terminal, start the Celery worker (Required for Ingestion):
   ```powershell
   cd backend
   celery -A core.celery_app worker --loglevel=info -P eventlet
   ```
// turbo
5. In a NEW terminal, start the Next.js frontend:
   ```powershell
   cd client
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.
