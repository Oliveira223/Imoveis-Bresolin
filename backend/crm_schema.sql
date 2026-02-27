-- Tabela de Corretores
CREATE TABLE IF NOT EXISTS corretores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL, -- Senha simples ou hash, idealmente hash
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes (Evolução da tabela interesse)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    objetivo VARCHAR(50), -- 'Moradia', 'Investimento'
    imovel_interesse_id INTEGER REFERENCES imoveis(id) ON DELETE SET NULL,
    corretor_id INTEGER REFERENCES corretores(id) ON DELETE SET NULL,
    nivel_funil INTEGER DEFAULT 1, -- 1: Lead, 2: Contato, 3: Visita, 4: Proposta, 5: Venda
    status VARCHAR(50) DEFAULT 'Novo', -- 'Novo', 'Em Atendimento', 'Ignorado', 'Vendido', 'Arquivado'
    preco_max DECIMAL(15, 2),
    qtd_ligacoes INTEGER DEFAULT 0,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT
);

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id SERIAL PRIMARY KEY,
    corretor_id INTEGER REFERENCES corretores(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    data_limite TIMESTAMP,
    concluida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_corretor ON clientes(corretor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_corretor ON tarefas(corretor_id);
