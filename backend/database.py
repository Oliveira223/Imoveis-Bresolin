from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# ==============================
# Carrega variáveis de ambiente do .env
# ==============================
load_dotenv()


def is_running_in_docker():
    return os.path.exists('/.dockerenv')


# Regra de prioridade:
# - Fora do Docker: prioriza DATABASE_URL_LOCAL (útil para túnel SSH local)
# - No Docker: prioriza DATABASE_URL (host do serviço interno, ex.: bresolin_db)
if is_running_in_docker():
    DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL_LOCAL")
else:
    DATABASE_URL = os.getenv("DATABASE_URL_LOCAL") or os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise Exception("A variável de ambiente DATABASE_URL não está definida.")

# ==============================
# Cria engine de conexão com o PostgreSQL
# ==============================
engine = create_engine(DATABASE_URL)
