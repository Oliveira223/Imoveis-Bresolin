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
DATABASE_URL = os.getenv("DATABASE_URL")

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
UPLOAD_FOLDER = os.path.join(BASE_DIR, '..', 'static', 'img', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# Inicialização do aplicativo Flask
# ==============================
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, '..', 'static'),
    template_folder=os.path.join(BASE_DIR, '..', 'templates')
)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

print("[INFO] DATABASE_URL:", DATABASE_URL)


# ================================
# SEGURANÇA - Autenticação básica para rotas admin
# ================================
from flask import Response

def check_auth(username, password):
    return username == 'admin' and password == 'Bresolin2003'  # Senha do painel admin

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
    return render_template("admin.html")


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

        imagens_result = con.execute(text('SELECT url, tipo FROM imagens_imovel WHERE imovel_id = :id'), {'id': imovel_id})
        imagens = [dict(row._mapping) for row in imagens_result]

    return render_template('editar_imovel.html', imovel=imovel, imagens=imagens)

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

    return render_template('imovel.html', imovel=imovel, imagens=imagens)
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
# Página de Pesquisa com Filtros
# ==============================
@app.route('/pesquisa')
def pagina_pesquisa():
    termo      = request.args.get('termo', '')
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

    
    max_preco = request.args.get('max_preco', '').replace('.', '')
    if max_preco.isdigit():
        max_preco = int(max_preco)
    else:
        max_preco = ''
    id_        = request.args.get('id', '')

    query = "SELECT * FROM imoveis WHERE ativo = true"
    params = {}

    if termo.isdigit():
        query += " AND id = :id"
        params['id'] = termo

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

    if tipo:
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
        params['piscina'] = piscina

    if churrasqueira == '1':
        query += " AND churrasqueira = true"
        params['churrasqueira'] = churrasqueira

    # Execução da consulta
    with engine.connect() as conn:
        resultado = conn.execute(text(query), params).mappings()
        imoveis = [dict(row) for row in resultado]

    # Retorno com os filtros reaplicados
    return render_template("pesquisa.html", imoveis=imoveis,
                           termo=termo, cidade=cidade, uf=uf, bairro=bairro, tipo=tipo,
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
            for campo in ['iptu', 'valor_condominio']:
                if data.get(campo) in ('', None):
                    data[campo] = None

            print("[DEBUG] Dados recebidos para cadastro:", data)

            data['ativo'] = bool(int(data.get('ativo', 1)))
            data['condominio_id'] = data.get('condominio_id') or None

            con.execute(text('''
                INSERT INTO imoveis (
                    condominio_id, titulo, descricao, preco, imagem,
                    tipo, pretensao, quartos, suites, banheiros, vagas,
                    area, endereco, bairro, cidade, uf, ativo, link, 
                    estagio, maps_iframe, campo_extra2, entrega, banheiros_com_chuveiro, iptu, valor_condominio, piscina, churrasqueira
                ) VALUES (
                    :condominio_id, :titulo, :descricao, :preco, :imagem,
                    :tipo, :pretensao, :quartos, :suites, :banheiros, :vagas,
                    :area, :endereco, :bairro, :cidade, :uf, :ativo, :link,
                    :estagio, :maps_iframe, :campo_extra2, :entrega, :banheiros_com_chuveiro, :iptu, :valor_condominio, :piscina, :churrasqueira
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
            data['ativo'] = bool(int(data.get('ativo', 1)))
            data['condominio_id'] = data.get('condominio_id') or None 

            # Tratamento para campos numéricos e opcionais vazios
            for campo in ['iptu', 'valor_condominio']:
                if data.get(campo) in ('', None):
                    data[campo] = None

            for campo in ['entrega', 'campo_extra2', 'maps_iframe', 'estagio']:
                if data.get(campo) == '':
                    data[campo] = None

            # Garante valores padrão para checkboxes
            for campo in ['piscina', 'churrasqueira']:
                data[campo] = bool(data.get(campo, False))


            con.execute(text('''
                UPDATE imoveis SET
                    condominio_id    = :condominio_id, 
                    titulo           = :titulo, 
                    descricao        = :descricao,
                    preco            = :preco,
                    imagem           = :imagem,
                    tipo             = :tipo, 
                    pretensao        = :pretensao, 
                    quartos          = :quartos, 
                    suites           = :suites,
                    banheiros        = :banheiros, 
                    vagas            = :vagas,
                    area             = :area,
                    endereco         = :endereco,
                    bairro           = :bairro,
                    cidade           = :cidade, 
                    uf               = :uf, 
                    ativo            = :ativo, 
                    link             = :link,   
                    estagio          = :estagio,
                    maps_iframe      = :maps_iframe,
                    campo_extra2     = :campo_extra2,
                    entrega          = :entrega,
                    iptu             = :iptu,
                    valor_condominio = :valor_condominio,
                    piscina          = :piscina,
                    churrasqueira    = :churrasqueira
                WHERE id = :id
            '''), data)
            return '', 204

        elif request.method == 'DELETE':
            con.execute(text('DELETE FROM imoveis WHERE id = :id'), {'id': imovel_id})
            return '', 204

# Alterna o status ativo/inativo do imóvel
@app.route('/api/imoveis/<int:imovel_id>/toggle', methods=['POST'])
def toggle_ativo(imovel_id):
    with engine.begin() as con:
        con.execute(text('UPDATE imoveis SET ativo = NOT ativo WHERE id = :id'), {'id': imovel_id})
        return '', 204

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
# API - Cadastro de Condomínios
# ==============================
@app.route('/api/condominios', methods=['GET', 'POST'])
def api_condominios():
    with engine.begin() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT * FROM condominios'))
            condominios = [dict(row._mapping) for row in result]
            return jsonify(condominios)

        if request.method == 'POST':
            data = request.json
            con.execute(text('''
                INSERT INTO condominios (
                    nome, descricao, imagem, bairro, cidade, uf,
                    estagio, lancamento, entrega, total_unidades,
                    n_andares, area_laje, ri, iptu, atualizado_em
                ) VALUES (
                    :nome, :descricao, :imagem, :bairro, :cidade, :uf,
                    :estagio, :lancamento, :entrega, :total_unidades,
                    :n_andares, :area_laje, :ri, :iptu, :atualizado_em
                )
            '''), data)
            return '', 201



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
DATABASE_URL = os.getenv("DATABASE_URL")  # ou substitua pela string completa

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
