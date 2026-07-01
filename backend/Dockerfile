# Bhao.pk Backend — Node.js + Python multi-runtime container
FROM node:20-slim

# Install Python 3 for scrapers
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything
COPY . .

# Install Python scraper dependencies in a venv
RUN python3 -m venv /app/scrapers/.venv \
    && /app/scrapers/.venv/bin/pip install --no-cache-dir -r scrapers/requirements.txt

# Install Node.js dependencies and build TypeScript
RUN npm install --no-audit --no-fund && npx tsc && npm prune --omit=dev

# Expose port (Railway sets PORT env var automatically)
EXPOSE ${PORT:-3001}

CMD ["node", "dist/server.js"]
