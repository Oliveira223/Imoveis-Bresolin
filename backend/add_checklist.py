from database import engine
from sqlalchemy import text

def add_checklist_column():
    try:
        with engine.connect() as conn:
            # Postgres JSONB
            conn.execute(text("ALTER TABLE clientes ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '{}'"))
            conn.commit()
            print("Coluna 'checklist' (JSONB) adicionada/verificada com sucesso.")
    except Exception as e:
        print(f"Erro ao adicionar coluna: {e}")

if __name__ == "__main__":
    add_checklist_column()
