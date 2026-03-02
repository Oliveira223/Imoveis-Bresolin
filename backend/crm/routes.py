from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import check_password_hash
from sqlalchemy import text
from database import engine

# Define o Blueprint 'crm'
crm_bp = Blueprint('crm', __name__, 
                  template_folder='templates',
                  static_folder='static',
                  url_prefix='/corretores')

# Middleware para verificar login antes de cada requisição
@crm_bp.before_request
def verificar_autenticacao():
    # Rotas públicas (não exigem login) e arquivos estáticos
    if request.endpoint == 'crm.login' or request.endpoint == 'crm.static':
        return

    # Se não estiver logado, redireciona para login
    if 'corretor_id' not in session:
        return redirect(url_for('crm.login'))

@crm_bp.route('/')
def dashboard():
    return render_template('crm_dashboard.html')

@crm_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Se já estiver logado, redireciona para o dashboard (/corretores)
    if 'corretor_id' in session:
        return redirect(url_for('crm.dashboard'))

    if request.method == 'POST':
        nome = request.form.get('nome')
        senha = request.form.get('senha')
        
        if not nome or not senha:
            flash('Preencha todos os campos.', 'danger')
            return render_template('login.html')
            
        with engine.connect() as conn:
            # Busca corretor pelo nome
            result = conn.execute(
                text("SELECT id, nome, senha_hash, ativo FROM corretores WHERE nome = :nome"),
                {'nome': nome}
            )
            corretor = result.mappings().first()
            
            if corretor and check_password_hash(corretor['senha_hash'], senha):
                if not corretor['ativo']:
                    flash('Conta inativa. Contate o administrador.', 'danger')
                else:
                    # Login bem-sucedido
                    session['corretor_id'] = corretor['id']
                    session['corretor_nome'] = corretor['nome']
                    return redirect(url_for('crm.dashboard'))
            else:
                flash('Usuário ou senha incorretos.', 'danger')
                
    return render_template('login.html')

@crm_bp.route('/logout')
def logout():
    session.pop('corretor_id', None)
    session.pop('corretor_nome', None)
    return redirect(url_for('crm.login'))

# ==============================
# API - LEADS DO KANBAN
# ==============================
@crm_bp.route('/api/leads', methods=['POST'])
def create_lead():
    try:
        data = request.json
        nome = data.get('nome')
        telefone = data.get('telefone')
        objetivo = data.get('objetivo', 'Moradia')
        interesse = data.get('interesse')
        observacoes = data.get('observacoes', '')
        corretor_id = session.get('corretor_id')

        if not nome or not telefone:
            return jsonify({'erro': 'Nome e Telefone são obrigatórios'}), 400

        # Formata observações se houver interesse específico
        obs_final = observacoes
        if interesse:
            obs_final = f"Interesse em: {interesse}\n{observacoes}"

        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO clientes 
                (nome, telefone, objetivo, corretor_id, nivel_funil, status, observacoes, data_cadastro)
                VALUES (:nome, :telefone, :objetivo, :corretor_id, 1, 'Em Atendimento', :observacoes, CURRENT_TIMESTAMP)
            """), {
                'nome': nome,
                'telefone': telefone,
                'objetivo': objetivo,
                'corretor_id': corretor_id,
                'observacoes': obs_final
            })
            
        return jsonify({'sucesso': True}), 201

    except Exception as e:
        print(f"Erro ao criar lead: {e}")
        return jsonify({'erro': 'Erro ao criar lead'}), 500

@crm_bp.route('/api/leads', methods=['GET'])
def get_leads():
    try:
        corretor_id = session.get('corretor_id')
        filtro = request.args.get('filtro', 'meus') # 'meus' ou 'todos'

        query = """
            SELECT 
                c.id, 
                c.nome, 
                c.email,
                c.telefone, 
                c.objetivo, 
                c.nivel_funil as status, 
                c.status as status_geral,
                c.observacoes,
                c.checklist,
                to_char(c.data_cadastro - INTERVAL '3 hours', 'DD/MM/YYYY HH24:MI') as data_formatada,
                i.titulo as imovel_titulo,
                i.preco as imovel_preco,
                co.nome as corretor_nome
            FROM clientes c
            LEFT JOIN imoveis i ON c.imovel_interesse_id = i.id
            LEFT JOIN corretores co ON c.corretor_id = co.id
            WHERE 1=1
        """
        
        params = {}
        
        # Se o filtro for 'meus', traz apenas os do corretor logado
        if filtro == 'meus':
            query += " AND c.corretor_id = :corretor_id AND c.status != 'Arquivado' AND c.status != 'Ignorado' AND c.status != 'Vendido'"
            params['corretor_id'] = corretor_id
        
        # Se o filtro for 'novos', traz apenas os sem corretor
        elif filtro == 'novos':
            query += " AND c.corretor_id IS NULL AND c.status != 'Arquivado' AND c.status != 'Ignorado'"
            
        elif filtro == 'todos':
             # Todos os ativos (exclui arquivados e vendidos)
             query += " AND c.status != 'Arquivado' AND c.status != 'Ignorado' AND c.status != 'Vendido'"
        
        elif filtro == 'arquivados':
            query += " AND (c.status = 'Arquivado' OR c.status = 'Ignorado')"
            
        elif filtro == 'vendidos':
            query += " AND (c.status = 'Vendido' OR c.nivel_funil = 5)"
            
        query += " ORDER BY c.data_cadastro DESC"

        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            leads = [dict(row._mapping) for row in result]
            
        response = jsonify(leads)
        response.headers.add('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0')
        response.headers.add('Pragma', 'no-cache')
        return response

    except Exception as e:
        print(f"Erro ao buscar leads: {e}")
        return jsonify({'erro': 'Erro ao buscar leads'}), 500

# ==============================
# API - ATUALIZAR STATUS DO LEAD
# ==============================
@crm_bp.route('/api/leads/status', methods=['PUT'])
def update_lead_status():
    try:
        data = request.json
        lead_id = data.get('id')
        novo_status_funil = data.get('status') # 1 a 5
        corretor_id = session.get('corretor_id')
        
        if not lead_id or not novo_status_funil:
            return jsonify({'erro': 'ID e Status são obrigatórios'}), 400
            
        with engine.begin() as conn:
            # Verifica se o lead existe e se o corretor pode movê-lo (segurança)
            # Se o lead não tem corretor, ao mover, ele assume o lead
            lead = conn.execute(
                text("SELECT corretor_id FROM clientes WHERE id = :id"), 
                {'id': lead_id}
            ).mappings().first()
            
            if not lead:
                return jsonify({'erro': 'Lead não encontrado'}), 404

            # Verifica permissão: só pode mover se for dono ou se não tiver dono
            if lead['corretor_id'] is not None and lead['corretor_id'] != corretor_id:
                return jsonify({'erro': 'Você não tem permissão para alterar este lead'}), 403
            
            # Atualização
            updates = "nivel_funil = :status"
            params = {'status': novo_status_funil, 'id': lead_id, 'corretor_id': corretor_id}
            
            # Se o lead não tinha dono, agora tem
            if lead['corretor_id'] is None:
                updates += ", corretor_id = :corretor_id, status = 'Em Atendimento'"
            
            conn.execute(text(f"UPDATE clientes SET {updates} WHERE id = :id"), params)
            
        return jsonify({'sucesso': True})

    except Exception as e:
        print(f"Erro ao atualizar status: {e}")
        return jsonify({'erro': 'Erro ao atualizar status'}), 500

# ==============================
# API - ATUALIZAR CHECKLIST DO LEAD
# ==============================
@crm_bp.route('/api/leads/checklist', methods=['PUT'])
def update_lead_checklist():
    try:
        data = request.json
        lead_id = data.get('id')
        checklist = data.get('checklist') # JSON object
        corretor_id = session.get('corretor_id')
        
        if not lead_id or checklist is None:
            return jsonify({'erro': 'ID e Checklist são obrigatórios'}), 400
            
        with engine.begin() as conn:
            # Serializa o JSON se necessário
            import json
            checklist_json = json.dumps(checklist)
            
            # Verifica propriedade
            result = conn.execute(
                text("UPDATE clientes SET checklist = :checklist WHERE id = :id AND corretor_id = :corretor_id"),
                {'checklist': checklist_json, 'id': lead_id, 'corretor_id': corretor_id}
            )
            
            if result.rowcount == 0:
                 return jsonify({'erro': 'Lead não encontrado ou sem permissão'}), 403

        return jsonify({'sucesso': True})

    except Exception as e:
        print(f"Erro ao atualizar checklist: {e}")
        return jsonify({'erro': 'Erro ao atualizar checklist'}), 500

# ==============================
# API - ATUALIZAR INFORMAÇÕES DO LEAD (OBSERVAÇÕES E STATUS GERAL)
# ==============================
@crm_bp.route('/api/leads/info', methods=['PUT'])
def update_lead_info():
    try:
        data = request.json
        lead_id = data.get('id')
        observacoes = data.get('observacoes')
        status_geral = data.get('status_geral') # 'Arquivado', 'Ignorado', etc.
        corretor_id = session.get('corretor_id')
        
        if not lead_id:
            return jsonify({'erro': 'ID é obrigatório'}), 400
            
        with engine.begin() as conn:
            updates = []
            params = {'id': lead_id, 'corretor_id': corretor_id}
            
            if observacoes is not None:
                updates.append("observacoes = :observacoes")
                params['observacoes'] = observacoes
                
            if status_geral:
                updates.append("status = :status_geral")
                params['status_geral'] = status_geral
            
            if not updates:
                return jsonify({'sucesso': True, 'mensagem': 'Nada a atualizar'})
                
            sql = f"UPDATE clientes SET {', '.join(updates)} WHERE id = :id AND corretor_id = :corretor_id"
            result = conn.execute(text(sql), params)
            
            if result.rowcount == 0:
                 return jsonify({'erro': 'Lead não encontrado ou sem permissão'}), 403
            
        return jsonify({'sucesso': True})

    except Exception as e:
        print(f"Erro ao atualizar info do lead: {e}")
        return jsonify({'erro': 'Erro ao atualizar informações'}), 500

# ==============================
# API - COMENTÁRIOS DO LEAD
# ==============================
@crm_bp.route('/api/leads/<int:lead_id>/comentarios', methods=['GET', 'POST'])
def api_lead_comentarios(lead_id):
    if request.method == 'GET':
        try:
            with engine.connect() as conn:
                query = """
                    SELECT 
                        c.id, 
                        c.texto, 
                        to_char(c.data_criacao, 'DD/MM/YYYY HH24:MI') as data_formatada,
                        co.nome as corretor_nome
                    FROM comentarios_clientes c
                    LEFT JOIN corretores co ON c.corretor_id = co.id
                    WHERE c.cliente_id = :lead_id
                    ORDER BY c.data_criacao DESC
                """
                result = conn.execute(text(query), {'lead_id': lead_id})
                comentarios = [dict(row._mapping) for row in result]
            
            response = jsonify(comentarios)
            response.headers.add('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0')
            response.headers.add('Pragma', 'no-cache')
            return response
        except Exception as e:
            print(f"Erro ao buscar comentários: {e}")
            return jsonify({'erro': 'Erro ao buscar comentários'}), 500

    if request.method == 'POST':
        try:
            data = request.json
            texto = data.get('texto')
            corretor_id = session.get('corretor_id')
            
            if not texto:
                return jsonify({'erro': 'Texto é obrigatório'}), 400
                
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT INTO comentarios_clientes (cliente_id, corretor_id, texto)
                    VALUES (:cliente_id, :corretor_id, :texto)
                """), {
                    'cliente_id': lead_id,
                    'corretor_id': corretor_id,
                    'texto': texto
                })
            
            return jsonify({'sucesso': True}), 201
            
        except Exception as e:
            print(f"Erro ao adicionar comentário: {e}")
            return jsonify({'erro': 'Erro ao adicionar comentário'}), 500

@crm_bp.route('/api/leads/<int:lead_id>/comentarios/<int:comentario_id>', methods=['DELETE'])
def api_delete_comentario(lead_id, comentario_id):
    try:
        corretor_id = session.get('corretor_id')
        with engine.begin() as conn:
            # Só permite deletar se for dono do comentário ou admin (futuro)
            # Por enquanto, deixamos deletar se for o autor
            result = conn.execute(text("DELETE FROM comentarios_clientes WHERE id = :id AND corretor_id = :corretor_id AND cliente_id = :cliente_id"), 
                                {'id': comentario_id, 'corretor_id': corretor_id, 'cliente_id': lead_id})
            
            if result.rowcount == 0:
                return jsonify({'erro': 'Comentário não encontrado ou sem permissão'}), 403
                
        return jsonify({'sucesso': True})
    except Exception as e:
        print(f"Erro ao deletar comentário: {e}")
        return jsonify({'erro': 'Erro ao deletar comentário'}), 500

@crm_bp.route('/api/leads/<int:lead_id>', methods=['DELETE'])
def delete_lead(lead_id):
    try:
        # Verifica se está logado
        if 'corretor_id' not in session:
             return jsonify({'erro': 'Não autorizado'}), 401
             
        corretor_id = session.get('corretor_id')

        with engine.begin() as conn:
            # Primeiro verifica se o lead pertence ao corretor
            check = conn.execute(
                text("SELECT id FROM clientes WHERE id = :id AND corretor_id = :corretor_id"),
                {'id': lead_id, 'corretor_id': corretor_id}
            ).fetchone()
            
            if not check:
                return jsonify({'erro': 'Lead não encontrado ou sem permissão'}), 403

            # Remove dependências (tarefas, comentários)
            conn.execute(text("DELETE FROM tarefas WHERE cliente_id = :id"), {'id': lead_id})
            conn.execute(text("DELETE FROM comentarios_clientes WHERE cliente_id = :id"), {'id': lead_id})
            
            # Remove o lead
            result = conn.execute(text("DELETE FROM clientes WHERE id = :id"), {'id': lead_id})
            
        return jsonify({'sucesso': True})
    except Exception as e:
        print(f"Erro ao deletar lead: {e}")
        return jsonify({'erro': 'Erro ao deletar lead'}), 500

# ==============================
# API - TAREFAS (AGENDA)
# ==============================
@crm_bp.route('/api/tarefas', methods=['GET', 'POST'])
def api_tarefas():
    corretor_id = session.get('corretor_id')
    
    if request.method == 'GET':
        try:
            with engine.connect() as conn:
                # Busca tarefas pendentes ou concluídas recentemente
                query = """
                    SELECT 
                        t.id, 
                        t.descricao, 
                        to_char(t.data_limite, 'DD/MM/YYYY HH24:MI') as data_formatada,
                        t.concluida,
                        t.tipo,
                        t.cliente_id,
                        c.nome as cliente_nome
                    FROM tarefas t
                    LEFT JOIN clientes c ON t.cliente_id = c.id
                    WHERE t.corretor_id = :corretor_id
                    ORDER BY t.concluida ASC, t.data_limite ASC
                """
                result = conn.execute(text(query), {'corretor_id': corretor_id})
                tarefas = [dict(row._mapping) for row in result]
                
            return jsonify(tarefas)
        except Exception as e:
            print(f"Erro ao buscar tarefas: {e}")
            return jsonify({'erro': 'Erro ao buscar tarefas'}), 500

    if request.method == 'POST':
        try:
            data = request.json
            descricao = data.get('descricao')
            cliente_id = data.get('cliente_id')
            data_limite = data.get('data_limite') # YYYY-MM-DD HH:MM:SS
            tipo = data.get('tipo', 'Geral')
            
            if not descricao:
                return jsonify({'erro': 'Descrição é obrigatória'}), 400
                
            with engine.begin() as conn:
                conn.execute(text("""
                    INSERT INTO tarefas (corretor_id, cliente_id, descricao, data_limite, tipo)
                    VALUES (:corretor_id, :cliente_id, :descricao, :data_limite, :tipo)
                """), {
                    'corretor_id': corretor_id,
                    'cliente_id': cliente_id,
                    'descricao': descricao,
                    'data_limite': data_limite,
                    'tipo': tipo
                })
                
            return jsonify({'sucesso': True}), 201
        except Exception as e:
            print(f"Erro ao criar tarefa: {e}")
            return jsonify({'erro': 'Erro ao criar tarefa'}), 500

@crm_bp.route('/api/tarefas/<int:tarefa_id>/concluir', methods=['PUT'])
def api_concluir_tarefa(tarefa_id):
    try:
        corretor_id = session.get('corretor_id')
        data = request.json
        concluida = data.get('concluida', True)
        
        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE tarefas SET concluida = :concluida 
                WHERE id = :id AND corretor_id = :corretor_id
            """), {'concluida': concluida, 'id': tarefa_id, 'corretor_id': corretor_id})
            
        return jsonify({'sucesso': True})
    except Exception as e:
        print(f"Erro ao concluir tarefa: {e}")
        return jsonify({'erro': 'Erro ao atualizar tarefa'}), 500
