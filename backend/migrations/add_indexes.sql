-- Índices para as colunas mais filtradas nas queries do app
-- Rodar manualmente no banco de produção uma única vez

-- Página de pesquisa e listagens
CREATE INDEX IF NOT EXISTS idx_imoveis_ativo ON imoveis (ativo);
CREATE INDEX IF NOT EXISTS idx_imoveis_empreendimento ON imoveis (empreendimento_id, ativo);
CREATE INDEX IF NOT EXISTS idx_imoveis_bairro ON imoveis (bairro);
CREATE INDEX IF NOT EXISTS idx_imoveis_cidade ON imoveis (cidade);
CREATE INDEX IF NOT EXISTS idx_imoveis_tipo ON imoveis (tipo);
CREATE INDEX IF NOT EXISTS idx_imoveis_destaque ON imoveis (destaque, ativo);

-- Empreendimentos
CREATE INDEX IF NOT EXISTS idx_empreendimentos_ativo ON empreendimentos (ativo);

-- CRM - Leads por corretor e status
CREATE INDEX IF NOT EXISTS idx_clientes_corretor ON clientes (corretor_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes (status);
CREATE INDEX IF NOT EXISTS idx_clientes_data ON clientes (data_cadastro DESC);

-- Acessos / visualizações
CREATE INDEX IF NOT EXISTS idx_acessos_imovel ON acessos (imovel_id);
CREATE INDEX IF NOT EXISTS idx_acessos_timestamp ON acessos (timestamp DESC);

-- Tarefas do CRM
CREATE INDEX IF NOT EXISTS idx_tarefas_corretor ON tarefas (corretor_id, concluida);
