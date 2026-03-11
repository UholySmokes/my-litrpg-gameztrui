FROM python:3.11-slim

WORKDIR /app

COPY user_agent/ ./user_agent/

WORKDIR /app/user_agent

RUN if [ -f requirements.txt ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    else \
        echo "No requirements.txt found"; \
    fi

EXPOSE 8088

ENV HOST=0.0.0.0
ENV PORT=8088

CMD ["python", "main.py"]
