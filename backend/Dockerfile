FROM python:3.11-slim

WORKDIR /app

# Install dependencies first from the backend source context.
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend package into /app/backend so existing imports continue to work.
COPY . ./backend/

# Set environment
ENV PORT=8080
ENV PYTHONPATH=/app

EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
