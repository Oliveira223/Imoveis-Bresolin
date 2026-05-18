# Bresolin Imóveis

Sistema de gestão imobiliária: site público de catálogo + CRM interno para corretores.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.11 + Flask + SQLAlchemy (raw SQL via `text()`) |
| Banco | PostgreSQL 16 |
| Frontend | HTML + CSS + JavaScript + jQuery + Jinja2 |
| Infra | Docker + Docker Compose + Nginx (proxy reverso) |
| CDN | Cloudflare (cache e otimização de imagens) |
| CI/CD | GitHub Actions → deploy automático no VPS via SSH |

## Estrutura

```
Imoveis-Bresolin/
├── requirements.txt          # dependências Python
├── docker-compose.yml
├── backend/
│   ├── app.py                # rotas públicas + admin
│   ├── database.py           # engine SQLAlchemy
│   ├── config.py             # constantes (UPLOAD_FOLDER, MAX_UPLOAD_SIZE…)
│   ├── utils/
│   │   ├── auth.py           # HTTP Basic auth + rate limiting
│   │   └── helpers.py        # api_error, api_success, serialize_dates
│   ├── services/
│   │   └── image_service.py  # allowed_file, comprimir_imagem, validar_imagem
│   ├── crm/
│   │   ├── routes.py         # blueprint /corretores
│   │   ├── templates/        # templates do CRM
│   │   └── static/           # CSS/JS do CRM
│   ├── migrations/
│   │   └── crm_schema.sql    # schema do CRM (referência)
│   ├── static/               # assets públicos (CSS, JS, uploads)
│   ├── templates/            # templates do site público
│   ├── relatorio_semanal.py  # gera PDF e envia email com métricas
│   ├── slides_config.json    # IDs de imóveis no slideshow da home
│   ├── .env.example
│   └── Dockerfile
└── .github/workflows/deploy.yml
```

## Desenvolvimento Local

O dev local não usa Docker — conecta direto ao banco de produção via SSH tunnel.

Setup inicial (na pasta `01_Imoveis_Bresolin/`, fora do repo):

```powershell
python -m venv dev\venv_app
dev\venv_app\Scripts\pip install -r Imoveis-Bresolin\requirements.txt

copy Imoveis-Bresolin\backend\.env.example Imoveis-Bresolin\backend\.env
# editar .env com credenciais reais
```

Rodar (dois terminais):

```powershell
# Terminal 1 — túnel SSH para o banco:
.\dev\tunnel_db.bat

# Terminal 2 — servidor Flask:
.\dev\run_dev.bat
# app em http://localhost:5000
```

`database.py` detecta automaticamente se está dentro do Docker e escolhe `DATABASE_URL` ou `DATABASE_URL_LOCAL`.

## Deploy

Push para `main` dispara o GitHub Actions automaticamente:

1. `pg_dump` → backup em `~/backups/` no VPS
2. `ssh-keyscan github.com` → atualiza `known_hosts`
3. `git reset --hard origin/main` → atualiza código no VPS
4. `docker compose up -d` → recria containers se a config mudou
5. `docker compose restart bresolin_app` → força gunicorn a reler os arquivos do volume
6. `curl /health` → 10 tentativas × 3s para confirmar que o app subiu

O container usa volume mount `./backend:/app`, então a imagem não precisa ser reconstruída a cada deploy. **Exceção:** quando `requirements.txt` muda, rodar manualmente no VPS:

```bash
cd ~/Imoveis-Bresolin
docker compose up -d --build
```

## Rotas

| Prefixo | Módulo | Auth |
|---|---|---|
| `/` | `app.py` | pública |
| `/admin` | `app.py` | HTTP Basic (`@requires_auth`) |
| `/corretores` | `crm/routes.py` | session (`corretor_id`) |
| `/health`, `/health/db` | `app.py` | pública |
| `/api/...` | `app.py` | mista |

## Variáveis de Ambiente

Copiar `backend/.env.example` e preencher:

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Conexão dentro do Docker (host: `bresolin_db`) |
| `DATABASE_URL_LOCAL` | Conexão local/tunnel (host: `127.0.0.1:5433`) |
| `SECRET_KEY` | Chave Flask para sessions |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Credenciais do painel `/admin` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Container PostgreSQL |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID` | Cache purge do Cloudflare |
| `EMAIL_REMETENTE` / `SENHA_APP_GMAIL` / `EMAIL_DESTINATARIOS` | Relatório semanal |

Gerar `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## Segurança

- **Headers HTTP:** `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` — adicionados em todas as respostas via `@app.after_request`
- **Cookies:** `HttpOnly=True`, `SameSite=Lax`, `Secure=True` (em produção)
- **CSRF:** `SameSite=Lax` como defesa principal; token flask-wtf apenas no login do CRM (`WTF_CSRF_ENABLED=False` globalmente para não exigir token nas APIs JSON)
- **XSS templates:** `{{ var | e | replace('\n', '<br>') | safe }}` — nunca `| safe` diretamente em conteúdo do usuário
- **XSS JavaScript:** `escaparHtml()` via `div.textContent + div.innerHTML` antes de injetar em `innerHTML`
- **Uploads:** dupla verificação — extensão (whitelist) + `PIL Image.verify()` para confirmar que é imagem real
- **Admin:** HTTP Basic Auth com rate limiting (10 req/min via `flask-limiter`)
- **Session fixation:** `session.clear()` antes de setar `corretor_id` no login do CRM
