# ==============================
# Bresolin Imóveis - Backend Flask
# ==============================

from flask import Flask, render_template, request, jsonify
import sqlite3
import os
from werkzeug.utils import secure_filename
from uuid import uuid4

# ==============================
# Configurações e caminhos
# ==============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, '..', 'database', 'imoveis.db')
UPLOAD_FOLDER = os.path.join(BASE_DIR, '..', 'static', 'img', 'uploads')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__,
            static_folder=os.path.join(BASE_DIR, '..', 'static'),
            template_folder=os.path.join(BASE_DIR, '..', 'templates'))

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ==============================
# Função auxiliar: transforma tuplas em dicionários
# ==============================

def dict_row_factory(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

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
    con = sqlite3.connect(DB_PATH)
    con.row_factory = dict_row_factory
    cur = con.cursor()

    # Busca o imóvel ativo
    cur.execute('SELECT * FROM imoveis WHERE id = ? AND ativo = 1', (imovel_id,))
    imovel = cur.fetchone()
    if not imovel:
        return render_template('404.html', mensagem="Imóvel não encontrado ou inativo"), 404

    # Busca imagens secundárias e planta
    cur.execute('SELECT url, tipo FROM imagens_imovel WHERE imovel_id = ?', (imovel_id,))
    imagens = cur.fetchall()
    con.close()

    return render_template('imovel.html', imovel=imovel, imagens=imagens)

# ==============================
# API - CRUD de Imóveis
# ==============================

@app.route('/api/imoveis', methods=['GET', 'POST'])
def api_imoveis():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = dict_row_factory
    cur = con.cursor()

    if request.method == 'GET':
        cur.execute('SELECT * FROM imoveis')
        imoveis = cur.fetchall()
        con.close()
        return jsonify(imoveis)

    if request.method == 'POST':
        data = request.json
        cur.execute('''
            INSERT INTO imoveis (
                condominio_id, titulo, descricao, preco, imagem,
                tipo, pretensao, quartos, suites, banheiros, vagas,
                area, endereco, bairro, cidade, uf, ativo, link
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('condominio_id'), data.get('titulo'), data.get('descricao'), data.get('preco'), data.get('imagem'),
            data.get('tipo'), data.get('pretensao'), data.get('quartos'), data.get('suites'), data.get('banheiros'),
            data.get('vagas'), data.get('area'), data.get('endereco'), data.get('bairro'),
            data.get('cidade'), data.get('uf'), data.get('ativo', 1), data.get('link')
        ))
        con.commit()
        con.close()
        return '', 201

@app.route('/api/imoveis/<int:imovel_id>', methods=['GET', 'PUT', 'DELETE'])
def api_imovel_id(imovel_id):
    con = sqlite3.connect(DB_PATH)
    con.row_factory = dict_row_factory
    cur = con.cursor()

    if request.method == 'GET':
        cur.execute('SELECT * FROM imoveis WHERE id = ?', (imovel_id,))
        row = cur.fetchone()
        con.close()
        return jsonify(row)

    elif request.method == 'PUT':
        data = request.json
        cur.execute('''
            UPDATE imoveis SET
                condominio_id = ?, titulo = ?, descricao = ?, preco = ?, imagem = ?,
                tipo = ?, pretensao = ?, quartos = ?, suites = ?, banheiros = ?, vagas = ?,
                area = ?, endereco = ?, bairro = ?, cidade = ?, uf = ?, ativo = ?, link = ?
            WHERE id = ?
        ''', (
            data.get('condominio_id'), data.get('titulo'), data.get('descricao'), data.get('preco'), data.get('imagem'),
            data.get('tipo'), data.get('pretensao'), data.get('quartos'), data.get('suites'), data.get('banheiros'),
            data.get('vagas'), data.get('area'), data.get('endereco'), data.get('bairro'),
            data.get('cidade'), data.get('uf'), data.get('ativo', 1), data.get('link'), imovel_id
        ))
        con.commit()
        con.close()
        return '', 204

    elif request.method == 'DELETE':
        cur.execute('DELETE FROM imoveis WHERE id = ?', (imovel_id,))
        con.commit()
        con.close()
        return '', 204

@app.route('/api/imoveis/<int:imovel_id>/toggle', methods=['POST'])
def toggle_ativo(imovel_id):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute('UPDATE imoveis SET ativo = 1 - ativo WHERE id = ?', (imovel_id,))
    con.commit()
    con.close()
    return '', 204

# ==============================
# API - Imagens do Imóvel (com tipo)
# ==============================

@app.route('/api/imoveis/<int:imovel_id>/imagens', methods=['GET', 'POST'])
def imagens_do_imovel(imovel_id):
    con = sqlite3.connect(DB_PATH)
    con.row_factory = dict_row_factory
    cur = con.cursor()

    if request.method == 'GET':
        cur.execute('SELECT id, url, tipo FROM imagens_imovel WHERE imovel_id = ?', (imovel_id,))
        imagens = cur.fetchall()
        con.close()
        return jsonify(imagens)

    if request.method == 'POST':
        data = request.json
        cur.execute('INSERT INTO imagens_imovel (imovel_id, url, tipo) VALUES (?, ?, ?)',
                    (imovel_id, data.get('url'), data.get('tipo')))
        con.commit()
        con.close()
        return '', 201

@app.route('/api/imagens/<int:imagem_id>', methods=['DELETE'])
def deletar_imagem(imagem_id):
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute('DELETE FROM imagens_imovel WHERE id = ?', (imagem_id,))
    con.commit()
    con.close()
    return '', 204

# ==============================
# API - Cadastro de Condomínios
# ==============================

@app.route('/api/condominios', methods=['GET', 'POST'])
def api_condominios():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = dict_row_factory
    cur = con.cursor()

    if request.method == 'GET':
        cur.execute('SELECT * FROM condominios')
        result = cur.fetchall()
        con.close()
        return jsonify(result)

    if request.method == 'POST':
        data = request.json
        cur.execute('''
            INSERT INTO condominios (
                nome, descricao, imagem, bairro, cidade, uf,
                estagio, lancamento, entrega, total_unidades,
                n_andares, area_laje, ri, iptu, atualizado_em
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('nome'), data.get('descricao'), data.get('imagem'),
            data.get('bairro'), data.get('cidade'), data.get('uf'),
            data.get('estagio'), data.get('lancamento'), data.get('entrega'),
            data.get('total_unidades'), data.get('n_andares'), data.get('area_laje'),
            data.get('ri'), data.get('iptu'), data.get('atualizado_em')
        ))
        con.commit()
        con.close()
        return '', 201
    

    
# ==============================
# Upload de Imagens (usado pelo painel admin)
# ==============================
@app.route('/upload', methods=['POST'])
def upload_imagem():
    # Verifica se algum arquivo foi enviado
    if 'arquivo' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400

    file = request.files['arquivo']

    # Verifica se o nome do arquivo está vazio
    if file.filename == '':
        return jsonify({'erro': 'Arquivo vazio'}), 400

    # ==============================
    # Geração de nome único para evitar sobrescrita
    # ==============================

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1]
    nome_unico = f"{uuid4().hex}{ext}"

    # ==============================
    # Validação da extensão permitida
    # ==============================

    extensoes_permitidas = {'.jpg', '.jpeg', '.png', '.webp'}
    if ext.lower() not in extensoes_permitidas:
        return jsonify({'erro': 'Extensão não permitida'}), 400

    # ==============================
    # Salvamento do arquivo na pasta /static/img/uploads
    # ==============================

    caminho_absoluto = os.path.join(app.config['UPLOAD_FOLDER'], nome_unico)
    file.save(caminho_absoluto)

    # Caminho público que será salvo no banco de dados
    url_publica = f'/static/img/uploads/{nome_unico}'

    return jsonify({'url': url_publica})


# ==============================
# Inicialização do Servidor
# ==============================

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)