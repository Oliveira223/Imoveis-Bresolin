import os
import psycopg2
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Lógica de conexão idêntica ao app.py
if os.name == 'nt': # Windows
    DATABASE_URL = os.getenv("DATABASE_URL_LOCAL") or os.getenv("DATABASE_URL")
else: # Linux/VPS/Docker
    DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("DATABASE_URL_LOCAL")

if not DATABASE_URL:
    raise Exception("A variável de ambiente DATABASE_URL não está definida.")

def init_db():
    print(f"Conectando ao banco de dados...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Lê o arquivo SQL
        schema_path = os.path.join(os.path.dirname(__file__), 'crm_schema.sql')
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
            
        print("Executando script SQL...")
        cur.execute(schema_sql)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Tabelas do CRM criadas com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")

if __name__ == "__main__":
    init_db()
