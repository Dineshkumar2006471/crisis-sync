FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (using paths relative to the project root context)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend source code
COPY backend/ ./backend/

# Set environment
ENV PORT=8080
ENV PYTHONPATH=/app

EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
