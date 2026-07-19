# Use a stripped-down Debian Linux environment with Python 3.10 pre-installed
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# COPY DEPENDENCIES FIRST (Crucial for Caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the actual application code
COPY main.py .

# Expose the internal port to the Docker network
EXPOSE 8000

# The execution command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
