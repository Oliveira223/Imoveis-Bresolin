from backend.app import engine, text
with engine.connect() as con:
    res = con.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clientes'"))
    print([dict(row._mapping) for row in res])
