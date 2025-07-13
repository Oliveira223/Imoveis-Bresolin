import sqlite3
import os

# Caminho para o banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'imoveis.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# Conexão e cursor
con = sqlite3.connect(DB_PATH)
cur = con.cursor()

# ===========================
# TABELA: condominios
# ===========================
cur.execute('''
CREATE TABLE condominios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    imagem TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    estagio TEXT,
    lancamento TEXT,
    entrega TEXT,
    total_unidades INTEGER,
    n_andares INTEGER,
    area_laje REAL,
    ri TEXT,
    iptu TEXT,
    atualizado_em TEXT
)
''')

# ===========================
# TABELA: caracteristicas_condominio
# ===========================
cur.execute('''
CREATE TABLE caracteristicas_condominio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominio_id INTEGER NOT NULL,
    caracteristica TEXT,
    FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE CASCADE
)
''')

# ===========================
# TABELA: imoveis
# ===========================
cur.execute('''
CREATE TABLE imoveis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condominio_id INTEGER,
    titulo TEXT NOT NULL,
    descricao TEXT,
    preco REAL,               -- ex: 790000.00
    imagem TEXT,
    tipo TEXT,                -- ex: Casa, Apartamento
    pretensao TEXT,           -- ex: Venda, Aluguel
    quartos INTEGER,
    suites INTEGER,
    banheiros INTEGER,
    vagas INTEGER,
    area REAL,                -- ex: 132.5
    andar INTEGER,            -- ex: 0 = térreo
    endereco TEXT,
    bairro TEXT,
    cidade TEXT,
    uf TEXT,
    ativo INTEGER DEFAULT 1,
    link TEXT,
    FOREIGN KEY (condominio_id) REFERENCES condominios(id) ON DELETE SET NULL
)
''')

# ===========================
# TABELA: imagens_imovel
# ===========================
cur.execute('''
CREATE TABLE imagens_imovel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imovel_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('principal', 'secundaria', 'planta')),
    FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE
)
''')

# ===========================
# TABELA: tipologias (opcional)
# ===========================
cur.execute('''
CREATE TABLE tipologias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imovel_id INTEGER NOT NULL,
    area REAL,
    quartos INTEGER,
    suites INTEGER,
    vagas INTEGER,
    preco REAL,
    FOREIGN KEY (imovel_id) REFERENCES imoveis(id) ON DELETE CASCADE
)
''')

# Finaliza e fecha
con.commit()
con.close()
print("✅ Banco de dados criado com sucesso!")
