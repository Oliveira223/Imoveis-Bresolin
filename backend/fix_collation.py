import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

if os.name == 'nt': # Windows
    DATABASE_URL = os.getenv("DATABASE_URL_LOCAL") or os.getenv("DATABASE_URL")
else: # Linux/VPS/Docker
    DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL_LOCAL")

if not DATABASE_URL:
    print("❌ Erro: DATABASE_URL não encontrada.")
    exit(1)

def fix_collation():
    print(f"Tentando conectar ao banco...")
    try:
        # Conecta ao banco 'postgres' ou ao banco alvo para rodar o comando
        # Precisamos conectar no banco alvo para rodar o comando REFRESH COLLATION VERSION nele?
        # A documentação diz: "ALTER DATABASE name REFRESH COLLATION VERSION"
        # Pode ser executado conectado em qualquer banco se formos superusuários, 
        # ou conectado no próprio banco.
        
        conn = psycopg2.connect(DATABASE_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Pega o nome do banco atual
        cur.execute("SELECT current_database()")
        db_name = cur.fetchone()[0]
        print(f"Banco conectado: {db_name}")
        
        print(f"Executando: ALTER DATABASE {db_name} REFRESH COLLATION VERSION")
        cur.execute(f"ALTER DATABASE {db_name} REFRESH COLLATION VERSION")
        
        print("✅ Collation atualizado com sucesso!")
        print("Agora tente reiniciar a aplicação.")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro ao atualizar collation: {e}")
        print("Dica: Se o erro for sobre estar sendo usado por outros usuários, você pode precisar parar a aplicação primeiro.")

if __name__ == "__main__":
    fix_collation()
