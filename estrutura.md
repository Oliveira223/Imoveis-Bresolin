bresolin_imoveis/
│
├── static/                     # Páginas
|   | └── css/
|   |      ├── pesquisa.css
|   |      ├── index.css
|   |      └── components/
|   |           └── card_imovel.css
|   |
│   ├── js/
│   │   ├── main.js           # JS do site público
│   │   └── admin.js          # JS da área admin
│   └── img/                  # Imagens estáticas (ex: logo)
│
├── templates/                  
|       ├── admin.html
|       ├── imovel.html
|       ├── index.html
|       ├── pesquisa.html
|       └── partials/
|             └── card_imovel.html
|
|
├── database/
│   └── imoveis.db            # Banco de dados SQLite
│
├── backend/
│   ├── app.py                # Backend Flask
│   └── requirements.txt      # Dependências Python
│
|   dados.txt                 # Info temporaria
├── estrutura.md              # Estrutuação dos arquivos
└── README.md                 # Explicação do projeto
