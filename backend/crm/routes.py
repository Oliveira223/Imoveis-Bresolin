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
@crm_bp.route('/api/leads', methods=['GET'])
def get_leads():
    try:
        corretor_id = session.get('corretor_id')
        filtro = request.args.get('filtro', 'meus') # 'meus' ou 'todos'

        query = """
            SELECT 
                c.id, 
                c.nome, 
                c.telefone, 
                c.objetivo, 
                c.nivel_funil as status, 
                to_char(c.data_cadastro, 'DD/MM HH24:MI') as data_formatada,
                i.titulo as imovel_titulo,
                co.nome as corretor_nome
            FROM clientes c
            LEFT JOIN imoveis i ON c.imovel_interesse_id = i.id
            LEFT JOIN corretores co ON c.corretor_id = co.id
            WHERE c.status != 'Arquivado'
        """
        
        params = {}
        
        # Se o filtro for 'meus', traz apenas os do corretor logado OU sem corretor (leads novos)
        if filtro == 'meus':
            query += " AND (c.corretor_id = :corretor_id OR c.corretor_id IS NULL)"
            params['corretor_id'] = corretor_id
            
        query += " ORDER BY c.data_cadastro DESC"

        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            leads = [dict(row._mapping) for row in result]
            
        return jsonify(leads)

    except Exception as e:
        print(f"Erro ao buscar leads: {e}")
        return jsonify({'erro': 'Erro ao buscar leads'}), 500
