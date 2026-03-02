from database import engine
from sqlalchemy import text

print("Adicionando coluna cliente_id na tabela tarefas...")
try:
    with engine.begin() as conn:
        conn.execute(text("""
            ALTER TABLE tarefas 
            ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL;
        """))
        print("Coluna 'cliente_id' adicionada com sucesso.")
except Exception as e:
    print(f"Erro ao alterar tabela: {e}")
