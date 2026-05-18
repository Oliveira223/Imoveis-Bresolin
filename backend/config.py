import os

# Uploads
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB

# Compressão de imagem
MAX_IMAGE_WIDTH = 1200
IMAGE_QUALITY = 82

# Slideshow
DEFAULT_SLIDE_INTERVAL = 8   # segundos
MIN_SLIDE_INTERVAL = 3
MAX_SLIDE_INTERVAL = 60

# Admin
MAX_FEATURED_PROPERTIES = 6  # máx. imóveis em destaque

# Dirs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'img', 'uploads')
SLIDES_CONFIG_PATH = os.path.join(BASE_DIR, 'slides_config.json')
