# ==============================
# Bresolin Imóveis - Backend Flask com PostgreSQL
# ==============================
from flask import Flask, render_template, request, jsonify, Response
from sqlalchemy import create_engine, text
from werkzeug.utils import secure_filename
from uuid import uuid4
from dotenv import load_dotenv
import os

import psycopg2
from psycopg2.extras import RealDictCursor

# ==============================
# Carrega variáveis de ambiente do .env
# ==============================
load_dotenv()
# Para pc (não esquecer de abrir ssh)
DATABASE_URL = os.getenv("DATABASE_URL_LOCAL") or os.getenv("DATABASE_URL")

# Para gthub
#DATABASE_URL = os.getenv("DATABASE_URL")


if not DATABASE_URL:
    raise Exception("A variável de ambiente DATABASE_URL não está definida.")

# ==============================
# Cria engine de conexão com o PostgreSQL
# ==============================
engine = create_engine(DATABASE_URL)

# ==============================
# Configurações de diretórios e uploads
# ==============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'img', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# Inicialização do aplicativo Flask
# ==============================
app = Flask(
    __name__,
    static_folder='static',
    template_folder='templates'
)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

print("[INFO] DATABASE_URL:", DATABASE_URL)


# ================================
# Gerar ID dos empreendimentos
# ================================
def gerar_proximo_codigo_empreendimento():
    """Gera o próximo código sequencial para empreendimentos (EMP1, EMP2, etc.)"""
    with engine.connect() as con:
        # Como não há empreendimentos antigos, só conta quantos existem
        result = con.execute(text("SELECT COUNT(*) FROM empreendimentos"))
        count = result.fetchone()[0]
        return f"EMP{count + 1}"


# ================================
# SEGURANÇA - Autenticação básica para rotas admin
# ================================
from flask import Response

def check_auth(username, password):
    admin_user = os.getenv('ADMIN_USERNAME', 'admin')
    admin_pass = os.getenv('ADMIN_PASSWORD', 'change_this_password')
    return username == admin_user and password == admin_pass

def authenticate():
    return Response(
        'Acesso restrito.\n', 401,
        {'WWW-Authenticate': 'Basic realm="Painel Admin"'}
    )

def requires_auth(f):
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated

# ================================
# ROTA PROTEGIDA: Painel Administrativo
# ================================
@app.route("/admin")
@requires_auth
def admin():
    return render_template("dashboard.html")


# ================================
# ROTA PROTEGIDA: Página de Edição de Imóvel
# ================================
@app.route('/admin/imovel/<int:imovel_id>/editar')
@requires_auth
def editar_imovel(imovel_id):
    with engine.connect() as con:
        imovel_result = con.execute(text('SELECT * FROM imoveis WHERE id = :id'), {'id': imovel_id})
        imovel = imovel_result.mappings().first()

        if not imovel:
            return render_template('404.html', mensagem="Imóvel não encontrado"), 404

        imagens_result = con.execute(
        text('SELECT id, url, tipo FROM imagens_imovel WHERE imovel_id = :id'),
        {'id': imovel_id}
        )
        imagens = [dict(row._mapping) for row in imagens_result]

    return render_template('editar_imovel.html', imovel=imovel, imagens=imagens)

# ================================
# ROTA PROTEGIDA: Página de Edição de Empreendimento
# ================================
@app.route('/admin/empreendimento/<empreendimento_id>/editar')
@requires_auth
def editar_empreendimento(empreendimento_id):
    with engine.connect() as con:
        empreendimento_result = con.execute(
            text('SELECT * FROM empreendimentos WHERE id = :id'), 
            {'id': empreendimento_id}
        )
        empreendimento = empreendimento_result.mappings().first()

        if not empreendimento:
            return render_template('404.html', mensagem="Empreendimento não encontrado"), 404

    return render_template('editar_empreendimento.html', empreendimento=empreendimento)

# Busca imóveis vinculados a um empreendimento específico
@app.route('/api/empreendimentos/<empreendimento_id>/imoveis', methods=['GET'])
def api_empreendimento_imoveis(empreendimento_id):
    with engine.connect() as con:
        # Busca imóveis vinculados ao empreendimento
        vinculados_result = con.execute(
            text('SELECT * FROM imoveis WHERE empreendimento_id = :id ORDER BY titulo'),
            {'id': empreendimento_id}
        )
        imoveis_vinculados = [dict(row._mapping) for row in vinculados_result]
        
        # Busca imóveis disponíveis (sem empreendimento)
        disponiveis_result = con.execute(
            text('SELECT * FROM imoveis WHERE empreendimento_id IS NULL ORDER BY titulo')
        )
        imoveis_disponiveis = [dict(row._mapping) for row in disponiveis_result]
        
        return jsonify({
            'vinculados': imoveis_vinculados,
            'disponiveis': imoveis_disponiveis
        })


# Página inicial
@app.route('/')
def index():
    registrar_acesso()  # registra acesso geral à home
    return render_template('index.html')


# Página de detalhes do imóvel
@app.route('/imovel/<int:imovel_id>')
def pagina_imovel(imovel_id):
    registrar_acesso(imovel_id)  # registra acesso ao imóvel

    with engine.connect() as con:
        imovel_result = con.execute(
            text('SELECT * FROM imoveis WHERE id = :id AND ativo = TRUE'),
            {'id': imovel_id}
        )
        imovel = imovel_result.mappings().first()

        if not imovel:
            return render_template('404.html', mensagem="Imóvel não encontrado ou inativo"), 404

        imagens_result = con.execute(
            text('SELECT url, tipo FROM imagens_imovel WHERE imovel_id = :id'),
            {'id': imovel_id}
        )
        imagens = [dict(row._mapping) for row in imagens_result]
        
        # Busca imóveis similares (mesmo tipo e bairro, excluindo o imóvel atual)
        similares_result = con.execute(
            text('''
                SELECT * FROM imoveis 
                WHERE ativo = TRUE 
                AND id != :id 
                AND (tipo = :tipo OR bairro = :bairro) 
                ORDER BY 
                    CASE 
                        WHEN tipo = :tipo AND bairro = :bairro THEN 1
                        WHEN tipo = :tipo THEN 2
                        WHEN bairro = :bairro THEN 3
                        ELSE 4
                    END,
                    id DESC
                LIMIT 6
            '''),
            {
                'id': imovel_id,
                'tipo': imovel['tipo'],
                'bairro': imovel['bairro']
            }
        )
        imoveis_similares = [dict(row._mapping) for row in similares_result]

    return render_template('imovel.html', imovel=imovel, imagens=imagens, imoveis_similares=imoveis_similares)
    
# Página de detalhes do empreendimento
@app.route('/empreendimento/<empreendimento_id>')
def pagina_empreendimento(empreendimento_id):
    with engine.connect() as con:
        # Busca dados do empreendimento
        empreendimento_result = con.execute(
            text('SELECT * FROM empreendimentos WHERE id = :id'),
            {'id': empreendimento_id}
        )
        empreendimento_row = empreendimento_result.mappings().first()

        if not empreendimento_row:
            return render_template('404.html', mensagem="Empreendimento não encontrado"), 404

        # Converter para dicionário para poder usar update()
        empreendimento = dict(empreendimento_row)

        # Busca imagens do empreendimento
        imagens_result = con.execute(
            text('SELECT url, tipo FROM imagens_empreendimento WHERE empreendimento_id = :id'),
            {'id': empreendimento_id}
        )
        imagens = [dict(row._mapping) for row in imagens_result]

        # Busca imóveis relacionados ao empreendimento
        imoveis_result = con.execute(
            text('SELECT * FROM imoveis WHERE empreendimento_id = :id AND ativo = TRUE ORDER BY id DESC'),
            {'id': empreendimento_id}
        )
        imoveis_relacionados = [dict(row._mapping) for row in imoveis_result]
        
        # Busca empreendimentos similares (mesmo bairro, excluindo o atual)
        similares_result = con.execute(
            text('''
                SELECT * FROM empreendimentos 
                WHERE id != :id 
                AND bairro = :bairro 
                ORDER BY id DESC
                LIMIT 6
            '''),
            {
                'id': empreendimento_id,
                'bairro': empreendimento['bairro']
            }
        )
        empreendimentos_similares = [dict(row._mapping) for row in similares_result]

        # Calcular estatísticas dos imóveis vinculados
        stats_result = con.execute(text("""
            SELECT 
                MIN(preco) as preco_min_imoveis,
                MAX(preco) as preco_max_imoveis,
                MIN(area) as area_min_imoveis,
                MAX(area) as area_max_imoveis,
                MIN(quartos) as quartos_min_imoveis,
                MAX(quartos) as quartos_max_imoveis,
                MIN(vagas) as vagas_min_imoveis,
                MAX(vagas) as vagas_max_imoveis
            FROM imoveis 
            WHERE empreendimento_id = :empreendimento_id AND ativo = true
        """), {"empreendimento_id": empreendimento_id})
        
        stats = stats_result.fetchone()
        if stats:
            empreendimento.update({
                'preco_min_imoveis': stats.preco_min_imoveis,
                'preco_max_imoveis': stats.preco_max_imoveis,
                'area_min_imoveis': stats.area_min_imoveis,
                'area_max_imoveis': stats.area_max_imoveis,
                'quartos_min_imoveis': stats.quartos_min_imoveis,
                'quartos_max_imoveis': stats.quartos_max_imoveis,
                'vagas_min_imoveis': stats.vagas_min_imoveis,
                'vagas_max_imoveis': stats.vagas_max_imoveis
            })

    return render_template('empreendimento.html', 
                         empreendimento=empreendimento,
                         imagens=imagens,
                         imoveis_relacionados=imoveis_relacionados,
                         empreendimentos_similares=empreendimentos_similares)

# ==============================
# API - Renderização do mini-card reutilizável
# ==============================
@app.route('/api/card/<int:imovel_id>')
def api_card(imovel_id):
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM imoveis WHERE id = :id"), {"id": imovel_id})
        imovel = result.fetchone()

    if not imovel:
        return "Imóvel não encontrado", 404

    return render_template('partials/card_imovel.html', imovel=imovel)

# ==============================
# API - Renderização do mini-card de empreendimento reutilizável
# ==============================
@app.route('/api/card_empreendimento/<empreendimento_id>')
def api_card_empreendimento(empreendimento_id):
    with engine.connect() as conn:
        # Buscar dados do empreendimento
        result = conn.execute(text("SELECT * FROM empreendimentos WHERE id = :id"), {"id": empreendimento_id})
        empreendimento = result.fetchone()
        
        if not empreendimento:
            return "Empreendimento não encontrado", 404
        
        # Buscar estatísticas dos imóveis do empreendimento
        stats_result = conn.execute(text("""
            SELECT 
                COUNT(*) as imoveis_disponiveis,
                MIN(preco) as preco_min,
                MAX(preco) as preco_max,
                MIN(area) as area_min,
                MAX(area) as area_max
            FROM imoveis 
            WHERE empreendimento_id = :empreendimento_id AND ativo = true
        """), {"empreendimento_id": empreendimento_id})
        
        stats = stats_result.fetchone()
        
        # Combinar dados do empreendimento com estatísticas
        empreendimento_data = dict(empreendimento._mapping)
        if stats:
            empreendimento_data.update({
                'imoveis_disponiveis': stats.imoveis_disponiveis or 0,
                'preco_min': stats.preco_min,
                'preco_max': stats.preco_max,
                'area_min': stats.area_min,
                'area_max': stats.area_max
            })
    
    return render_template('partials/card_empreendimento.html', empreendimento=empreendimento_data)


# ==============================
# Página de Pesquisa com Filtros
# ==============================
@app.route('/pesquisa')
def pagina_pesquisa():
    termo      = request.args.get('termo', '')
    localizacao = request.args.get('localizacao', '')  # Novo campo unificado
    cidade     = request.args.get('cidade', '')
    uf         = request.args.get('uf', '')
    bairro     = request.args.get('bairro', '')
    tipo       = request.args.get('tipo', '')
    quartos    = request.args.get('quartos', '')
    banheiros  = request.args.get('banheiros', '')
    vagas      = request.args.get('vagas', '')
    area_min   = request.args.get('area_min', '')
    area_max   = request.args.get('area_max', '')
    estagio    = request.args.get('estagio', '')
    entrega    = request.args.get('entrega', '')
    piscina           = request.args.get('piscina', '')
    churrasqueira     = request.args.get('churrasqueira', '')
    destaque    = request.args.get('destaque', '')

    max_preco = request.args.get('max_preco', '').replace('.', '')
    if max_preco.isdigit():
        max_preco = int(max_preco)
    else:
        max_preco = ''
    id_        = request.args.get('id', '')

    # ==============================
    # BUSCA POR EMPREENDIMENTOS
    # ==============================
    empreendimentos = []
    
    # Lógica: mostrar empreendimentos quando tipo = "" (todos) ou tipo = "empreendimento"
    mostrar_empreendimentos = (tipo == '' or tipo == 'empreendimento')
    
    if mostrar_empreendimentos:
        emp_query = "SELECT * FROM empreendimentos WHERE 1=1"
        emp_params = {}

        # Filtro por termo genérico nos empreendimentos
        if termo:
            if termo.isdigit():
                emp_query += " AND id = :id"
                emp_params['id'] = termo
            else:
                emp_query += """
                AND (
                    unaccent(nome) ILIKE unaccent(:termo) OR
                    unaccent(descricao) ILIKE unaccent(:termo) OR
                    unaccent(cidade) ILIKE unaccent(:termo) OR
                    unaccent(bairro) ILIKE unaccent(:termo) OR
                    unaccent(uf) ILIKE unaccent(:termo)
                )
                """
                emp_params['termo'] = f"%{termo}%"

        # Filtro por localização unificada
        if localizacao:
            emp_query += """
            AND (
                unaccent(cidade) ILIKE unaccent(:localizacao) OR
                unaccent(bairro) ILIKE unaccent(:localizacao) OR
                unaccent(uf) ILIKE unaccent(:localizacao)
            )
            """
            emp_params['localizacao'] = f"%{localizacao}%"

        # Filtros específicos para empreendimentos
        if cidade:
            emp_query += " AND unaccent(cidade) ILIKE unaccent(:cidade)"
            emp_params['cidade'] = f"%{cidade}%"

        if uf:
            emp_query += " AND uf = :uf"
            emp_params['uf'] = uf

        if bairro:
            emp_query += " AND unaccent(bairro) ILIKE unaccent(:bairro)"
            emp_params['bairro'] = f"%{bairro}%"

        if estagio:
            emp_query += " AND estagio = :estagio"
            emp_params['estagio'] = estagio

        emp_query += " ORDER BY id DESC"

        # Execução da consulta de empreendimentos
        with engine.connect() as conn:
            emp_resultado = conn.execute(text(emp_query), emp_params).mappings()
            empreendimentos_raw = [dict(row) for row in emp_resultado]
            
            # Para cada empreendimento, buscar estatísticas dos imóveis
            for emp in empreendimentos_raw:
                stats_result = conn.execute(text("""
                    SELECT 
                        COUNT(*) as imoveis_disponiveis,
                        MIN(preco) as preco_min,
                        MAX(preco) as preco_max,
                        MIN(area) as area_min,
                        MAX(area) as area_max
                    FROM imoveis 
                    WHERE empreendimento_id = :empreendimento_id AND ativo = true
                """), {"empreendimento_id": emp['id']})
                
                stats = stats_result.fetchone()
                if stats:
                    emp.update({
                        'imoveis_disponiveis': stats.imoveis_disponiveis or 0,
                        'preco_min': stats.preco_min,
                        'preco_max': stats.preco_max,
                        'area_min': stats.area_min,
                        'area_max': stats.area_max
                    })
                
                empreendimentos.append(emp)

    # ==============================
    # BUSCA POR IMÓVEIS
    # ==============================
    imoveis = []
    
    # Lógica: mostrar imóveis quando tipo != "empreendimento"
    mostrar_imoveis = (tipo != 'empreendimento')
    
    if mostrar_imoveis:
        query = "SELECT * FROM imoveis WHERE ativo = true"
        params = {}

        if termo.isdigit():
            query += " AND id = :id"
            params['id'] = termo

        # Filtro por localização unificada
        if localizacao:
            query += """
            AND (
                unaccent(cidade) ILIKE unaccent(:localizacao) OR
                unaccent(bairro) ILIKE unaccent(:localizacao) OR
                unaccent(uf) ILIKE unaccent(:localizacao)
            )
            """
            params['localizacao'] = f"%{localizacao}%"

        # Filtro por termo genérico
        if termo:
            query += """
            AND (
                unaccent(titulo) ILIKE unaccent(:termo) OR
                unaccent(descricao) ILIKE unaccent(:termo) OR
                unaccent(cidade) ILIKE unaccent(:termo) OR
                unaccent(bairro) ILIKE unaccent(:termo) OR
                unaccent(endereco) ILIKE unaccent(:termo) OR
                CAST(id AS TEXT) ILIKE :termo
            )"""
            params['termo'] = f"%{termo}%"

        # Filtros específicos
        if bairro:
            query += " AND unaccent(bairro) ILIKE unaccent(:bairro)"
            params['bairro'] = f"%{bairro}%"

        if cidade:
            query += " AND unaccent(cidade) ILIKE unaccent(:cidade)"
            params['cidade'] = f"%{cidade}%"

        if uf:
            query += " AND uf ILIKE :uf"
            params['uf'] = uf

        # Filtro por tipo - só aplicar se não for "" (todos) e não for "empreendimento"
        if tipo and tipo != 'empreendimento':
            query += " AND tipo ILIKE :tipo"
            params['tipo'] = tipo

        if max_preco:
            query += " AND preco <= :max_preco"
            params['max_preco'] = max_preco

        if area_min:
            query += " AND area >= :area_min"
            params['area_min'] = area_min

        if area_max:
            query += " AND area <= :area_max"
            params['area_max'] = area_max

        if id_:
            query += " AND CAST(id AS TEXT) ILIKE :id"
            params['id'] = f"%{id_}%"

        if quartos:
            query += " AND quartos = :quartos"
            params['quartos'] = quartos

        if banheiros:
            query += " AND banheiros = :banheiros"
            params['banheiros'] = banheiros

        if vagas:
            query += " AND vagas = :vagas"
            params['vagas'] = vagas

        if estagio:
            query += " AND estagio ILIKE :estagio"
            params['estagio'] = estagio

        if entrega:
            query += " AND entrega ILIKE :entrega"
            params['entrega'] = entrega

        if piscina == '1':
            query += " AND piscina = true"

        if churrasqueira == '1':
            query += " AND churrasqueira = true"

        # Execução da consulta de imóveis
        with engine.connect() as conn:
            resultado = conn.execute(text(query), params).mappings()
            imoveis = [dict(row) for row in resultado]

    # Retorno com os filtros reaplicados
    return render_template("pesquisa.html", 
                   empreendimentos=empreendimentos,
                   imoveis=imoveis,
                   termo=termo, localizacao=localizacao, tipo=tipo,
                   max_preco=max_preco, id=id_, quartos=quartos,
                   banheiros=banheiros, vagas=vagas,
                   area_min=area_min, area_max=area_max,
                   estagio=estagio, entrega=entrega, piscina=piscina, churrasqueira=churrasqueira)

# ==============================
# API - CRUD de Imóveis
# ==============================

# Lista ou cadastra imóvel
@app.route('/api/imoveis', methods=['GET', 'POST'])
def api_imoveis():
    with engine.begin() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT * FROM imoveis ORDER BY id DESC'))
            imoveis = [dict(row._mapping) for row in result]
            return jsonify(imoveis)

        if request.method == 'POST':
            data = request.json
            for campo in ['entrega', 'estagio', 'maps_iframe', 'campo_extra2']:
                if campo not in data:
                    data[campo] = None

            data = request.json

            # Converte strings vazias para None nos campos opcionais
            for campo in ['entrega', 'estagio', 'maps_iframe', 'campo_extra2']:
                if data.get(campo) == '':
                    data[campo] = None

            # Converte campos numéricos vazios para None
            for campo in ['iptu']:
                if data.get(campo) in ('', None):
                    data[campo] = None

            print("[DEBUG] Dados recebidos para cadastro:", data)

            data['ativo'] = bool(int(data.get('ativo', 1)))
            data['empreendimento_id'] = data.get('empreendimento_id') or None

            con.execute(text('''
                INSERT INTO imoveis (
                    empreendimento_id, titulo, descricao, preco, imagem,
                    tipo, pretensao, quartos, suites, banheiros, vagas,
                    area, endereco, bairro, cidade, uf, ativo, link, 
                    estagio, maps_iframe, campo_extra2, entrega, banheiros_com_chuveiro, iptu, piscina, churrasqueira
                ) VALUES (
                    :empreendimento_id, :titulo, :descricao, :preco, :imagem,
                    :tipo, :pretensao, :quartos, :suites, :banheiros, :vagas,
                    :area, :endereco, :bairro, :cidade, :uf, :ativo, :link,
                    :estagio, :maps_iframe, :campo_extra2, :entrega, :banheiros_com_chuveiro, :iptu, :piscina, :churrasqueira
                )
            '''), data)
            print("[DEBUG] Imóvel inserido com sucesso!")
            return '', 201

# Detalha, edita ou remove imóvel específico
@app.route('/api/imoveis/<int:imovel_id>', methods=['GET', 'PUT', 'DELETE'])
def api_imovel_id(imovel_id):
    with engine.begin() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT * FROM imoveis WHERE id = :id'), {'id': imovel_id})
            imovel = result.mappings().first()
            return jsonify(imovel)

        elif request.method == 'PUT':
            data = request.json
            data['id'] = imovel_id 
            
            # Tratamento para campos opcionais vazios
            for campo in ['descricao', 'imagem', 'endereco_completo', 'empreendimento_id']:
                if data.get(campo) == '':
                    data[campo] = None

            # Tratamento para campos numéricos
            for campo in ['preco', 'area', 'quartos', 'banheiros', 'vagas']:
                if data.get(campo) in ('', None):
                    data[campo] = None
                elif data.get(campo) is not None:
                    try:
                        if campo == 'preco' or campo == 'area':
                            data[campo] = float(data[campo])
                        else:
                            data[campo] = int(data[campo])
                    except (ValueError, TypeError):
                        data[campo] = None

            con.execute(text('''
                UPDATE imoveis SET
                    tipo = :tipo,
                    preco = :preco,
                    area = :area,
                    quartos = :quartos,
                    banheiros = :banheiros,
                    vagas = :vagas,
                    bairro = :bairro,
                    cidade = :cidade,
                    uf = :uf,
                    descricao = :descricao,
                    imagem = :imagem,
                    endereco_completo = :endereco_completo,
                    empreendimento_id = :empreendimento_id,
                    atualizado_em = NOW()
                WHERE id = :id
            '''), data)
            
            return '', 200

        elif request.method == 'DELETE':
            con.execute(text('DELETE FROM imoveis WHERE id = :id'), {'id': imovel_id})
            return '', 204

# Alterna o status ativo/inativo do imóvel
@app.route('/api/imoveis/<int:imovel_id>/toggle', methods=['POST'])
def toggle_ativo(imovel_id):
    with engine.begin() as con:
        con.execute(text('UPDATE imoveis SET ativo = NOT ativo WHERE id = :id'), {'id': imovel_id})
        return '', 204

# Rota para destacar imoveis
@app.route('/api/imoveis/destaque', methods=['POST'])
@requires_auth
def definir_destaques():
    ids = request.json.get('ids', [])
    if not isinstance(ids, list) or len(ids) > 6:
        return jsonify({'erro': 'Selecione até 6 imóveis.'}), 400

    with engine.begin() as con:
        con.execute(text('UPDATE imoveis SET destaque = FALSE'))
        if ids:
            con.execute(
                text('UPDATE imoveis SET destaque = TRUE WHERE id = ANY(:ids)'),
                {'ids': ids}
            )
    return jsonify({'sucesso': True})



# ==============================
# API - Imagens do Imóvel
# ==============================
# Lista ou adiciona imagens ao imóvel
@app.route('/api/imoveis/<int:imovel_id>/imagens', methods=['GET', 'POST'])
def imagens_do_imovel(imovel_id):
    with engine.begin() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT id, url, tipo FROM imagens_imovel WHERE imovel_id = :id'), {'id': imovel_id})
            imagens = [dict(row._mapping) for row in result]
            return jsonify(imagens)

        if request.method == 'POST':
            data = request.json
            con.execute(text('''
                INSERT INTO imagens_imovel (imovel_id, url, tipo)
                VALUES (:imovel_id, :url, :tipo)
            '''), {
                'imovel_id': imovel_id,
                'url': data.get('url'),
                'tipo': data.get('tipo')
            })
            return '', 201

# Deleta uma imagem específica
@app.route('/api/imagens/<int:imagem_id>', methods=['DELETE'])
def deletar_imagem(imagem_id):
    with engine.begin() as con:
        con.execute(text('DELETE FROM imagens_imovel WHERE id = :id'), {'id': imagem_id})
        return '', 204

# ==============================
# API - Imagens do Empreendimento
# ==============================
# Lista ou adiciona imagens ao empreendimento
@app.route('/api/empreendimentos/<empreendimento_id>/imagens', methods=['GET', 'POST'])
def imagens_do_empreendimento(empreendimento_id):
    with engine.begin() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT id, url, tipo FROM imagens_empreendimento WHERE empreendimento_id = :id'), {'id': empreendimento_id})
            imagens = [dict(row._mapping) for row in result]
            return jsonify(imagens)

        if request.method == 'POST':
            data = request.json
            con.execute(text('''
                INSERT INTO imagens_empreendimento (empreendimento_id, url, tipo)
                VALUES (:empreendimento_id, :url, :tipo)
            '''), {
                'empreendimento_id': empreendimento_id,
                'url': data.get('url'),
                'tipo': data.get('tipo')
            })
            return '', 201

# Deleta uma imagem específica de empreendimento
@app.route('/api/imagens_empreendimento/<int:imagem_id>', methods=['DELETE'])
def deletar_imagem_empreendimento(imagem_id):
    with engine.begin() as con:
        con.execute(text('DELETE FROM imagens_empreendimento WHERE id = :id'), {'id': imagem_id})
        return '', 204


# ==============================
# API - CRUD de Empreendimentos
# ==============================

# Lista ou cadastra empreendimento
@app.route('/api/empreendimentos', methods=['GET', 'POST'])
def api_empreendimentos():
    with engine.begin() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT * FROM empreendimentos ORDER BY id DESC'))
            empreendimentos = [dict(row._mapping) for row in result]
            return jsonify(empreendimentos)

        if request.method == 'POST':
            data = request.json
            
            # Gera o próximo código EMP
            codigo_empreendimento = gerar_proximo_codigo_empreendimento()
            
            # Extrai lista de imóveis selecionados
            imoveis_selecionados = data.pop('imoveis_selecionados', [])
            
            # Define valores padrão para todos os campos
            campos_padrao = {
                'nome': None,
                'descricao': None,
                'imagem': None,
                'bairro': None,
                'cidade': None,
                'uf': None,
                'estagio': None,
                'lancamento': None,
                'entrega': None,
                'total_unidades': None,
                'n_andares': None,
                'area_laje': None,
                'ri': None,
                'iptu': None,
                'preco_minimo': None,
                'preco_maximo': None,
                'area_minima': None,
                'area_maxima': None,
                'quartos_minimo': None,
                'quartos_maximo': None,
                'vagas_minimo': None,
                'vagas_maximo': None,
                'endereco_completo': None
            }
            
            # Mescla os dados recebidos com os valores padrão
            data_completa = {**campos_padrao, **data}
            
            # Converte strings vazias para None
            for campo, valor in data_completa.items():
                if valor == '':
                    data_completa[campo] = None

            # Converte campos de data vazios para None
            for campo in ['lancamento', 'entrega']:
                if data_completa.get(campo) == '':
                    data_completa[campo] = None

            # Converte campos numéricos vazios para None
            for campo in ['total_unidades', 'n_andares', 'area_laje', 'preco_minimo', 'preco_maximo', 
                         'area_minima', 'area_maxima', 'quartos_minimo', 'quartos_maximo', 
                         'vagas_minimo', 'vagas_maximo']:
                if data_completa.get(campo) in ('', None):
                    data_completa[campo] = None

            # Adiciona o código gerado
            data_completa['codigo'] = codigo_empreendimento
            
            # Insere o empreendimento
            con.execute(text('''
                INSERT INTO empreendimentos (
                    id, codigo, nome, descricao, imagem, bairro, cidade, uf, estagio,
                    lancamento, entrega, total_unidades, n_andares, area_laje, ri, iptu,
                    preco_minimo, preco_maximo, area_minima, area_maxima,
                    quartos_minimo, quartos_maximo, vagas_minimo, vagas_maximo, endereco_completo
                ) VALUES (
                    :codigo, :codigo, :nome, :descricao, :imagem, :bairro, :cidade, :uf, :estagio,
                    :lancamento, :entrega, :total_unidades, :n_andares, :area_laje, :ri, :iptu,
                    :preco_minimo, :preco_maximo, :area_minima, :area_maxima,
                    :quartos_minimo, :quartos_maximo, :vagas_minimo, :vagas_maximo, :endereco_completo
                )
            '''), data_completa)
            
            # Vincula imóveis selecionados (se houver)
            if imoveis_selecionados:
                for imovel_id in imoveis_selecionados:
                    con.execute(text('''
                        UPDATE imoveis 
                        SET empreendimento_id = (SELECT id FROM empreendimentos WHERE codigo = :codigo)
                        WHERE id = :imovel_id
                    '''), {'codigo': codigo_empreendimento, 'imovel_id': imovel_id})
            
            return '', 201

# Detalha, edita ou remove empreendimento específico
@app.route('/api/empreendimentos/<empreendimento_id>', methods=['GET', 'PUT', 'DELETE'])
def api_empreendimento_id(empreendimento_id):
    with engine.begin() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT * FROM empreendimentos WHERE id = :id'), {'id': empreendimento_id})
            empreendimento = result.mappings().first()
            return jsonify(empreendimento)

        elif request.method == 'PUT':
            data = request.json
            data['id'] = empreendimento_id
            
            # Extrai lista de imóveis selecionados
            imoveis_selecionados = data.pop('imoveis_selecionados', [])
            print(f"[DEBUG] Imóveis selecionados para empreendimento {empreendimento_id}: {imoveis_selecionados}")
            
            # Tratamento para campos opcionais vazios
            for campo in ['descricao', 'imagem', 'estagio', 'ri', 'iptu', 'endereco_completo']:
                if data.get(campo) == '':
                    data[campo] = None

            for campo in ['lancamento', 'entrega']:
                if data.get(campo) == '':
                    data[campo] = None

            for campo in ['total_unidades', 'n_andares', 'area_laje', 'preco_minimo', 'preco_maximo', 
                         'area_minima', 'area_maxima', 'quartos_minimo', 'quartos_maximo', 
                         'vagas_minimo', 'vagas_maximo']:
                if data.get(campo) in ('', None):
                    data[campo] = None

            # Atualiza o empreendimento
            con.execute(text('''
                UPDATE empreendimentos SET
                    nome = :nome,
                    descricao = :descricao,
                    imagem = :imagem,
                    bairro = :bairro,
                    cidade = :cidade,
                    uf = :uf,
                    estagio = :estagio,
                    lancamento = :lancamento,
                    entrega = :entrega,
                    total_unidades = :total_unidades,
                    n_andares = :n_andares,
                    area_laje = :area_laje,
                    ri = :ri,
                    iptu = :iptu,
                    preco_minimo = :preco_minimo,
                    preco_maximo = :preco_maximo,
                    area_minima = :area_minima,
                    area_maxima = :area_maxima,
                    quartos_minimo = :quartos_minimo,
                    quartos_maximo = :quartos_maximo,
                    vagas_minimo = :vagas_minimo,
                    vagas_maximo = :vagas_maximo,
                    endereco_completo = :endereco_completo,
                    atualizado_em = NOW()
                WHERE id = :id
            '''), data)
            
            # Processa vinculação de imóveis
            # Primeiro, desvincula todos os imóveis do empreendimento
            con.execute(text('''
                UPDATE imoveis 
                SET empreendimento_id = NULL 
                WHERE empreendimento_id = :empreendimento_id
            '''), {'empreendimento_id': empreendimento_id})
            print(f"[DEBUG] Desvinculados todos os imóveis do empreendimento {empreendimento_id}")
            
            # Depois, vincula apenas os imóveis selecionados
            if imoveis_selecionados:
                for imovel_id in imoveis_selecionados:
                    con.execute(text('''
                        UPDATE imoveis 
                        SET empreendimento_id = :empreendimento_id 
                        WHERE id = :imovel_id
                    '''), {
                        'empreendimento_id': empreendimento_id,
                        'imovel_id': imovel_id
                    })
                print(f"[DEBUG] Vinculados {len(imoveis_selecionados)} imóveis ao empreendimento {empreendimento_id}")
            
            return '', 200

        elif request.method == 'DELETE':
            # Primeiro, desvincula todos os imóveis do empreendimento
            con.execute(text('''
                UPDATE imoveis 
                SET empreendimento_id = NULL 
                WHERE empreendimento_id = :empreendimento_id
            '''), {'empreendimento_id': empreendimento_id})
            print(f"[DEBUG] Desvinculados todos os imóveis do empreendimento {empreendimento_id} antes da exclusão")
            
            # Depois, exclui o empreendimento
            con.execute(text('DELETE FROM empreendimentos WHERE id = :id'), {'id': empreendimento_id})
            return '', 204

# ==============================
# Sugestões de pesquisa
# ==============================
@app.route('/api/sugestoes')
def api_sugestoes():
    query = request.args.get('query', '')
    if not query:
        return jsonify([])

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT DISTINCT bairro FROM imoveis 
            WHERE unaccent(bairro) ILIKE unaccent(:q)
            UNION
            SELECT DISTINCT cidade FROM imoveis 
            WHERE unaccent(cidade) ILIKE unaccent(:q)
            UNION
            SELECT CAST(id AS TEXT) FROM imoveis 
            WHERE CAST(id AS TEXT) ILIKE :q
            LIMIT 10
        """), {"q": f"%{query}%"})
        sugestoes = [row[0] for row in result]

    return jsonify(sugestoes)


# ==============================
# CONEXÃO COM O POSTGRES (Render)
# ==============================
def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# ==============================
# CRIA TABELA DE ACESSOS (se não existir)
# ==============================
def criar_tabela_acessos():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS acessos (
                    id SERIAL PRIMARY KEY,
                    imovel_id INTEGER,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

# chama ao iniciar o app
criar_tabela_acessos()


def registrar_acesso(imovel_id=None):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO acessos (imovel_id) VALUES (%s)",
                (imovel_id,)
            )
            conn.commit()


            
# ==============================
# Inicialização do Servidor
# ==============================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"[INFO] Servidor iniciado em http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
