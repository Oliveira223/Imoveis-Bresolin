# Bresolin Imóveis

Site público de catálogo de imóveis + CRM interno para corretores, desenvolvido para a Bresolin Negócios Imobiliários.

**Stack:** Python/Flask · PostgreSQL · HTML + CSS + JavaScript · Jinja2 · Docker · Cloudflare CDN

---

## Páginas e Funcionalidades

### Site Público

| Página | Template | Descrição |
|---|---|---|
| Home | `index.html` | Slideshow de destaques, busca rápida, link para pesquisa |
| Pesquisa | `pesquisa.html` | Listagem com filtros, ordenação e busca por texto |
| Imóvel | `imovel.html` | Galeria de fotos, detalhes, botão WhatsApp |
| Empreendimento | `empreendimento.html` | Página do empreendimento com unidades disponíveis |
| Slides | `slides.html` | Slideshow em tela cheia para exibição interna |

### Painel Admin

| Página | Template | Descrição |
|---|---|---|
| Dashboard | `dashboard.html` | Visão geral: imóveis, acessos, interesses |
| Cadastro | `cadastro.html` | Formulário de novo imóvel/empreendimento + upload de imagens |
| Editar imóvel | `editar_imovel.html` | Edição completa + reordenação de fotos |
| Editar empreendimento | `editar_empreendimento.html` | Edição do empreendimento e suas unidades |

---

## Estrutura Frontend

```
backend/
├── templates/
│   ├── index.html
│   ├── pesquisa.html
│   ├── imovel.html
│   ├── empreendimento.html
│   ├── slides.html
│   ├── cadastro.html
│   ├── dashboard.html
│   ├── editar_imovel.html
│   ├── editar_empreendimento.html
│   ├── 404.html
│   └── partials/
│       ├── card_imovel.html        # card reutilizável na pesquisa
│       ├── card_empreendimento.html
│       └── footer.html
└── static/
    ├── css/
    │   ├── global.css              # reset, tipografia, variáveis globais
    │   ├── style.css               # home
    │   ├── pesquisa.css
    │   ├── imovel.css
    │   ├── empreendimento.css
    │   ├── slides.css
    │   ├── cadastro.css
    │   ├── dashboard.css
    │   ├── editar_imovel.css
    │   ├── editar_empreendimento.css
    │   ├── components/
    │   │   ├── card_imovel.css
    │   │   └── card_empreendimento.css
    │   └── dashboard-modules/      # CSS modular do admin (19 arquivos)
    │       ├── _variables.css
    │       ├── _base.css
    │       ├── _layout.css
    │       ├── _cards.css
    │       └── ...
    └── js/
        ├── main.js                 # home: slideshow, animação do logo
        ├── pesquisa.js             # filtros, autocomplete, ordenação
        ├── imovel.js               # galeria de fotos, navegação
        ├── cadastro.js             # preview de upload, validações
        ├── editar_imovel.js        # drag-and-drop de fotos, edição inline
        ├── editar_empreendimento.js
        ├── dashboard.js            # gráficos, tabelas dinâmicas
        └── slides.js               # slideshow automático
```

---

## Funcionalidades de Destaque

**Pesquisa (`pesquisa.js`)**
- Autocomplete de bairros e cidades em tempo real
- Filtros combinados: tipo, localização, preço máximo, área, quartos, banheiros, vagas, piscina, churrasqueira
- Ordenação client-side por menor/maior preço
- Tabs de pretensão (Todos / Compra / Aluguel)

**Galeria (`imovel.js`)**
- Navegação por toque (swipe) e teclado
- Troca de imagem com lazy load
- Modo tela cheia

**Upload e edição de imagens (`cadastro.js`, `editar_imovel.js`)**
- Preview antes de enviar
- Reordenação por drag-and-drop
- Exclusão com confirmação inline

**Slideshow (`slides.js`, `main.js`)**
- Intervalo configurável por imóvel via `slides_config.json`
- Animação SVG do logo na home

**Integração WhatsApp**
- Botão flutuante na página do imóvel
- Mensagem pré-formatada com ID, tipo e localização do imóvel

---

## Deploy

Push para `main` → GitHub Actions → VPS:

1. Backup do banco (`pg_dump`)
2. `git reset --hard origin/main`
3. `docker compose restart bresolin_app`
4. Health check em `/health`
