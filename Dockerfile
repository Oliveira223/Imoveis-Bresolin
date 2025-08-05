FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Copiar dependências e instalar
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código Python
COPY backend/ .

# Copiar templates e arquivos estáticos
COPY templates/ /app/templates/
COPY static/ /app/static/

# Instalar utilitário para esperar pelo PostgreSQL
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Comando inicial: aguardar o Postgres e iniciar Flask (Gunicorn)
CMD ["sh", "-c", "until pg_isready -h postgres -U admin; do sleep 2; done && gunicorn -b 0.0.0.0:5000 app:app"]
