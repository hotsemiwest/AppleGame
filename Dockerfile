FROM python:3.11-slim

WORKDIR /app

# CPU-only torch (훨씬 작은 이미지, 추론에는 GPU 불필요)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY ai_solver/requirements-server.txt .
RUN pip install --no-cache-dir -r requirements-server.txt

COPY ai_solver/ ./ai_solver/

RUN mkdir -p ai_solver/models hf_cache && \
    addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser && \
    chown -R appuser:appgroup /app

ENV HF_HOME=/app/hf_cache

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "uvicorn ai_solver.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
