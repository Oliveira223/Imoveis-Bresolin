# Imagem base do Python
FROM python:3.11-slim

# Instalar dependências do sistema e cliente PostgreSQL 16
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    lsb-release \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y postgresql-client-16 \
    && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho no container
WORKDIR /app

# Copiar dependências (requirements.txt está na raiz do repo)
COPY requirements.txt .

# Instalar dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código do backend
COPY backend/ .

# Expor a porta do Flask
EXPOSE 5000

# Comando padrão para rodar o app com Gunicorn (Produção)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "app:app"]
