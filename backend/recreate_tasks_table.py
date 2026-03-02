from database import engine
from sqlalchemy import text

print("Recriando tabela tarefas...")
try:
    with engine.begin() as conn:
        # Drop table if exists
        conn.execute(text("DROP TABLE IF EXISTS tarefas CASCADE"))
        print("Tabela tarefas removida.")
        
        # Create table with correct schema
        conn.execute(text("""
            CREATE TABLE tarefas (
                id SERIAL PRIMARY KEY,
                corretor_id INTEGER REFERENCES corretores(id) ON DELETE CASCADE,
                cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
                descricao TEXT NOT NULL,
                data_limite TIMESTAMP,
                concluida BOOLEAN DEFAULT FALSE,
                tipo VARCHAR(50),
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        print("Tabela 'tarefas' criada com sucesso com a coluna cliente_id.")
except Exception as e:
    print(f"Erro ao recriar tabela: {e}")
