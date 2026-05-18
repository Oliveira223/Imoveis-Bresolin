import os
import shutil
import logging
from flask import current_app
from config import ALLOWED_EXTENSIONS, MAX_IMAGE_WIDTH, IMAGE_QUALITY

logger = logging.getLogger(__name__)


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validar_imagem(caminho: str) -> bool:
    from PIL import Image
    try:
        with Image.open(caminho) as img:
            img.load()
        return True
    except Exception:
        return False


def comprimir_imagem(caminho: str, max_width: int = MAX_IMAGE_WIDTH, quality: int = IMAGE_QUALITY) -> bool:
    from PIL import Image, ImageOps
    try:
        with Image.open(caminho) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            if img.width > max_width:
                ratio = max_width / img.width
                img = img.resize((max_width, int(img.height * ratio)), Image.LANCZOS)
            img.save(caminho, 'JPEG', quality=quality, optimize=True)
        return True
    except Exception as e:
        logger.warning("Falha ao comprimir imagem %s: %s", caminho, e)
        return False


def mover_tmp_para_destino(url_atual: str, destino_dir: str, prefixo_url: str) -> str:
    """Move arquivo de /tmp/ para pasta definitiva e retorna nova URL."""
    if not url_atual or '/tmp/' not in url_atual:
        return url_atual
    nome = url_atual.split('/')[-1]
    upload_folder = current_app.config['UPLOAD_FOLDER']
    origem = os.path.join(upload_folder, 'tmp', nome)
    if not os.path.exists(origem):
        return url_atual
    os.makedirs(destino_dir, exist_ok=True)
    destino = os.path.join(destino_dir, nome)
    shutil.move(origem, destino)
    return f"{prefixo_url}/{nome}"
