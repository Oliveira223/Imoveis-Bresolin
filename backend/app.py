# ==============================
# Bresolin Imóveis - Backend Flask com PostgreSQL
# ==============================
from flask import Flask, render_template, request, jsonify
from sqlalchemy import create_engine, text
import os
from werkzeug.utils import secure_filename
from uuid import uuid4

# ==============================
# Configurações e caminhos
# ==============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, '..', 'static', 'img', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, '..', 'static'),
    template_folder=os.path.join(BASE_DIR, '..', 'templates')
)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ==============================
# Conexão com o banco PostgreSQL do Render
# ==============================
DATABASE_URL = os.environ.get('DATABASE_URL')
engine = create_engine(DATABASE_URL)

# ==============================
# Rotas HTML (Frontend)
# ==============================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/imovel/<int:imovel_id>')
def pagina_imovel(imovel_id):
    with engine.connect() as con:
        imovel_result = con.execute(text('SELECT * FROM imoveis WHERE id = :id AND ativo = 1'), {'id': imovel_id})
        imovel = imovel_result.mappings().first()

        if not imovel:
            return render_template('404.html', mensagem="Imóvel não encontrado ou inativo"), 404

        imagens_result = con.execute(text('SELECT url, tipo FROM imagens_imovel WHERE imovel_id = :id'), {'id': imovel_id})
        imagens = [dict(row._mapping) for row in imagens_result]

    return render_template('imovel.html', imovel=imovel, imagens=imagens)

# ==============================
# API - CRUD de Imóveis
# ==============================
@app.route('/api/imoveis', methods=['GET', 'POST'])
def api_imoveis():
    with engine.connect() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT * FROM imoveis'))
            imoveis = [dict(row._mapping) for row in result]
            return jsonify(imoveis)

        if request.method == 'POST':
            data = request.json
            con.execute(text('''
                INSERT INTO imoveis (
                    condominio_id, titulo, descricao, preco, imagem,
                    tipo, pretensao, quartos, suites, banheiros, vagas,
                    area, endereco, bairro, cidade, uf, ativo, link
                ) VALUES (
                    :condominio_id, :titulo, :descricao, :preco, :imagem,
                    :tipo, :pretensao, :quartos, :suites, :banheiros, :vagas,
                    :area, :endereco, :bairro, :cidade, :uf, :ativo, :link
                )
            '''), data)
            return '', 201

@app.route('/api/imoveis/<int:imovel_id>', methods=['GET', 'PUT', 'DELETE'])
def api_imovel_id(imovel_id):
    with engine.connect() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT * FROM imoveis WHERE id = :id'), {'id': imovel_id})
            imovel = result.mappings().first()
            return jsonify(imovel)

        elif request.method == 'PUT':
            data = request.json
            data['id'] = imovel_id
            con.execute(text('''
                UPDATE imoveis SET
                    condominio_id = :condominio_id, titulo = :titulo, descricao = :descricao, preco = :preco, imagem = :imagem,
                    tipo = :tipo, pretensao = :pretensao, quartos = :quartos, suites = :suites, banheiros = :banheiros, vagas = :vagas,
                    area = :area, endereco = :endereco, bairro = :bairro, cidade = :cidade, uf = :uf, ativo = :ativo, link = :link
                WHERE id = :id
            '''), data)
            return '', 204

        elif request.method == 'DELETE':
            con.execute(text('DELETE FROM imoveis WHERE id = :id'), {'id': imovel_id})
            return '', 204

@app.route('/api/imoveis/<int:imovel_id>/toggle', methods=['POST'])
def toggle_ativo(imovel_id):
    with engine.connect() as con:
        con.execute(text('UPDATE imoveis SET ativo = 1 - ativo WHERE id = :id'), {'id': imovel_id})
        return '', 204

# ==============================
# API - Imagens do Imóvel
# ==============================
@app.route('/api/imoveis/<int:imovel_id>/imagens', methods=['GET', 'POST'])
def imagens_do_imovel(imovel_id):
    with engine.connect() as con:
        if request.method == 'GET':
            result = con.execute(text('SELECT id, url, tipo FROM imagens_imovel WHERE imovel_id = :id'), {'id': imovel_id})
            imagens = [dict(row._mapping) for row in result]
            return jsonify(imagens)

        if request.method == 'POST':
            data = request.json
            con.execute(text('INSERT INTO imagens_imovel (imovel_id, url, tipo) VALUES (:imovel_id, :url, :tipo)'), {
                'imovel_id': imovel_id,
                'url': data.get('url'),
                'tipo': data.get('tipo')
            })
            return '', 201

@app.route('/api/imagens/<int:imagem_id>', methods=['DELETE'])
def deletar_imagem(imagem_id):
    with engine.connect() as con:
        con.execute(text('DELETE FROM imagens_imovel WHERE id = :id'), {'id': imagem_id})
        return '', 204

# ==============================
# API - Cadastro de Condomínios
# ==============================
@app.route('/api/condominios', methods=['GET', 'POST'])
def api_condominios():
    with engine.connect() as con:
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
# Upload de Imagens (usado pelo painel admin)
# ==============================
@app.route('/upload', methods=['POST'])
def upload_imagem():
    if 'arquivo' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400

    file = request.files['arquivo']
    if file.filename == '':
        return jsonify({'erro': 'Arquivo vazio'}), 400

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1]
    nome_unico = f"{uuid4().hex}{ext}"

    extensoes_permitidas = {'.jpg', '.jpeg', '.png', '.webp'}
    if ext.lower() not in extensoes_permitidas:
        return jsonify({'erro': 'Extensão não permitida'}), 400

    caminho_absoluto = os.path.join(app.config['UPLOAD_FOLDER'], nome_unico)
    file.save(caminho_absoluto)

    url_publica = f'/static/img/uploads/{nome_unico}'
    return jsonify({'url': url_publica})

# ==============================
# Inicialização do Servidor
# ==============================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
