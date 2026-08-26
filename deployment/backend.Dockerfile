
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1


WORKDIR /app

# Install system dependencies (for net tools, ping, etc.)
RUN apt-get update && apt-get install -y iputils-ping net-tools curl && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn eventlet

# Copy application code
COPY . .

# Create essential directories
RUN mkdir -p logs reports certs

# Expose port (internally)
EXPOSE 5000

# Start Gunicorn with Eventlet for SocketIO support
# Note: Using eventlet worker class for async/socketio support
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "app:app"]
