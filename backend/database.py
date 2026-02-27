from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# ==============================
# Carrega variáveis de ambiente do .env
# ==============================
load_dotenv()

# Lógica automática para banco de dados: 
# Localmente (Windows), priorizamos DATABASE_URL_LOCAL.
# Em outros ambientes (Linux/Docker/VPS), usamos DATABASE_URL.

if os.name == 'nt': # Windows
    DATABASE_URL = os.getenv("DATABASE_URL_LOCAL") or os.getenv("DATABASE_URL")
else: # Linux/VPS/Docker
    DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL_LOCAL")

if not DATABASE_URL:
    raise Exception("A variável de ambiente DATABASE_URL não está definida.")

# ==============================
# Cria engine de conexão com o PostgreSQL
# ==============================
engine = create_engine(DATABASE_URL)
