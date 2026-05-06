"""
Migra todas as fotos do Cloudinary para armazenamento local.
Organiza em static/img/uploads/imoveis/{id}/ e empreendimentos/{id}/
Atualiza as URLs no banco de dados ao final.
"""

import os
import re
import time
import urllib.request
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://admin:95443291!@bresolin_db:5432/bresolin_db')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, 'static', 'img', 'uploads')

engine = create_engine(DATABASE_URL)


def slug_pasta(valor):
    return re.sub(r'[^a-z0-9_]', '_', str(valor).lower().strip())[:60]


def baixar(url, destino):
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    try:
        urllib.request.urlretrieve(url, destino)
        return True
    except Exception as e:
        print(f"  [ERRO] {url}: {e}")
        return False


def migrar_galeria_imoveis(con):
    rows = con.execute(text(
        'SELECT id, imovel_id, url, tipo, ordem FROM imagens_imovel ORDER BY imovel_id, tipo, ordem, id'
    )).fetchall()

    contadores = {}
    atualizacoes = []

    for row in rows:
        img_id, imovel_id, url, tipo, ordem = row
        if not url or not url.startswith('http'):
            continue

        pasta = os.path.join(UPLOAD_DIR, 'imoveis', str(imovel_id))
        chave = (imovel_id, tipo)
        contadores[chave] = contadores.get(chave, 0) + 1
        n = contadores[chave]

        nome = f"{tipo}_{n:02d}.jpg"
        destino = os.path.join(pasta, nome)
        nova_url = f"/static/img/uploads/imoveis/{imovel_id}/{nome}"

        print(f"  imovel {imovel_id} | {tipo} #{n} → {nome}", end=" ")
        ok = baixar(url, destino)
        if ok:
            print("✓")
            atualizacoes.append((img_id, nova_url))
        else:
            print("✗ (mantendo URL original)")

        time.sleep(0.05)

    for img_id, nova_url in atualizacoes:
        con.execute(text('UPDATE imagens_imovel SET url = :url WHERE id = :id'),
                    {'url': nova_url, 'id': img_id})

    print(f"\n  Galeria imóveis: {len(atualizacoes)}/{len(rows)} atualizadas")


def migrar_imagem_principal_imoveis(con):
    rows = con.execute(text(
        "SELECT id, imagem FROM imoveis WHERE imagem IS NOT NULL AND imagem != '' AND imagem LIKE 'http%'"
    )).fetchall()

    atualizacoes = []

    for imovel_id, url in rows:
        pasta = os.path.join(UPLOAD_DIR, 'imoveis', str(imovel_id))
        destino = os.path.join(pasta, 'principal.jpg')
        nova_url = f"/static/img/uploads/imoveis/{imovel_id}/principal.jpg"

        print(f"  imovel {imovel_id} | principal", end=" ")
        ok = baixar(url, destino)
        if ok:
            print("✓")
            atualizacoes.append((imovel_id, nova_url))
        else:
            print("✗ (mantendo URL original)")

        time.sleep(0.05)

    for imovel_id, nova_url in atualizacoes:
        con.execute(text('UPDATE imoveis SET imagem = :url WHERE id = :id'),
                    {'url': nova_url, 'id': imovel_id})

    print(f"\n  Imagem principal imóveis: {len(atualizacoes)}/{len(rows)} atualizadas")


def migrar_galeria_empreendimentos(con):
    rows = con.execute(text(
        'SELECT id, empreendimento_id, url, tipo, ordem FROM imagens_empreendimento ORDER BY empreendimento_id, tipo, ordem, id'
    )).fetchall()

    contadores = {}
    atualizacoes = []

    for row in rows:
        img_id, emp_id, url, tipo, ordem = row
        if not url or not url.startswith('http'):
            continue

        pasta = os.path.join(UPLOAD_DIR, 'empreendimentos', str(emp_id))
        chave = (emp_id, tipo)
        contadores[chave] = contadores.get(chave, 0) + 1
        n = contadores[chave]

        nome = f"{tipo}_{n:02d}.jpg"
        destino = os.path.join(pasta, nome)
        nova_url = f"/static/img/uploads/empreendimentos/{emp_id}/{nome}"

        print(f"  empreendimento {emp_id} | {tipo} #{n} → {nome}", end=" ")
        ok = baixar(url, destino)
        if ok:
            print("✓")
            atualizacoes.append((img_id, nova_url))
        else:
            print("✗ (mantendo URL original)")

        time.sleep(0.05)

    for img_id, nova_url in atualizacoes:
        con.execute(text('UPDATE imagens_empreendimento SET url = :url WHERE id = :id'),
                    {'url': nova_url, 'id': img_id})

    print(f"\n  Galeria empreendimentos: {len(atualizacoes)}/{len(rows)} atualizadas")


def migrar_imagem_principal_empreendimentos(con):
    rows = con.execute(text(
        "SELECT id, imagem FROM empreendimentos WHERE imagem IS NOT NULL AND imagem != '' AND imagem LIKE 'http%'"
    )).fetchall()

    atualizacoes = []

    for emp_id, url in rows:
        pasta = os.path.join(UPLOAD_DIR, 'empreendimentos', str(emp_id))
        destino = os.path.join(pasta, 'principal.jpg')
        nova_url = f"/static/img/uploads/empreendimentos/{emp_id}/principal.jpg"

        print(f"  empreendimento {emp_id} | principal", end=" ")
        ok = baixar(url, destino)
        if ok:
            print("✓")
            atualizacoes.append((emp_id, nova_url))
        else:
            print("✗ (mantendo URL original)")

        time.sleep(0.05)

    for emp_id, nova_url in atualizacoes:
        con.execute(text('UPDATE empreendimentos SET imagem = :url WHERE id = :id'),
                    {'url': nova_url, 'id': emp_id})

    print(f"\n  Imagem principal empreendimentos: {len(atualizacoes)}/{len(rows)} atualizadas")


if __name__ == '__main__':
    print("=== Migração de fotos: Cloudinary → local ===\n")

    with engine.begin() as con:
        print("[ Imagens principais dos imóveis ]")
        migrar_imagem_principal_imoveis(con)

        print("\n[ Galeria dos imóveis ]")
        migrar_galeria_imoveis(con)

        print("\n[ Imagens principais dos empreendimentos ]")
        migrar_imagem_principal_empreendimentos(con)

        print("\n[ Galeria dos empreendimentos ]")
        migrar_galeria_empreendimentos(con)

    print("\n=== Migração concluída ===")
    print(f"Fotos salvas em: {UPLOAD_DIR}")
