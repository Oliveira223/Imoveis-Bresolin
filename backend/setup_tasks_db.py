from database import engine
from sqlalchemy import text

print("Iniciando setup da tabela tarefas...")
try:
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tarefas (
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
        print("Tabela 'tarefas' criada ou verificada com sucesso.")
except Exception as e:
    print(f"Erro ao criar tabela: {e}")
