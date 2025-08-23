// ================================
// Visualizador de imagens estilo galeria (com scroll e botões)
// ================================

document.addEventListener("DOMContentLoaded", () => {
  const imagens = Array.from(document.querySelectorAll(".thumb-secundaria"));
  if (imagens.length === 0) return;

  // ================================
  // Criação do visualizador fullscreen
  // ================================
  const viewer = document.createElement("div");
  viewer.id = "imagem-viewer";
  viewer.innerHTML = `
  <button class="fechar">
    <img src="/static/img/icons/close.svg" alt="Fechar">
  </button>

  <button class="navegacao prev">
    <img src="/static/img/icons/arrow-left.svg" alt="Anterior">
  </button>

  <div class="imagem-scroll-container"></div>
  <button class="navegacao next">
    <img src="/static/img/icons/arrow-right.svg" alt="Próxima">
  </button>
`;
  document.body.appendChild(viewer);

  const scrollContainer = viewer.querySelector(".imagem-scroll-container");
  let atual = 0;

  // ================================
  // Clona as miniaturas para o viewer fullscreen
  // ================================
  imagens.forEach((img) => {
    const clone = document.createElement("img");
    clone.src = img.src;
    clone.classList.add("imagem-fullscreen");
    scrollContainer.appendChild(clone);
  });

  const imagensFullscreen = scrollContainer.querySelectorAll(".imagem-fullscreen");

  // ================================
  // Abrir visualizador e posicionar a imagem atual
  // ================================
  function abrir(index) {
    atual = index;
    viewer.style.display = "flex";
    document.body.classList.add("modal-aberto");
    posicionar();
  }

  // ================================
  // Posicionar a imagem atual no centro
  // ================================
  function posicionar() {
    const larguraImagem = imagensFullscreen[0].offsetWidth;
    const deslocamento = atual * larguraImagem;
    scrollContainer.style.transform = `translateX(-${deslocamento}px)`;
  }

  // ================================
  // Fechar visualizador
  // ================================
  function fechar() {
    viewer.style.display = "none";
    document.body.classList.remove("modal-aberto");
  }

  // ================================
  // Navegação
  // ================================
  function anterior() {
    atual = atual > 0 ? atual - 1 : imagens.length - 1;
    posicionar();
  }

  function proximo() {
    atual = atual < imagens.length - 1 ? atual + 1 : 0;
    posicionar();
  }

  // ================================
  // Event listeners
  // ================================
  imagens.forEach((img, index) => {
    img.addEventListener("click", () => abrir(index));
  });

  viewer.querySelector(".fechar").addEventListener("click", fechar);
  viewer.querySelector(".prev").addEventListener("click", anterior);
  viewer.querySelector(".next").addEventListener("click", proximo);

  // Fechar com ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && viewer.style.display === "flex") {
      fechar();
    }
  });

  // Navegação com teclado
  document.addEventListener("keydown", (e) => {
    if (viewer.style.display === "flex") {
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proximo();
    }
  });

  // Fechar clicando fora da imagem
  viewer.addEventListener("click", (e) => {
    if (e.target === viewer) {
      fechar();
    }
  });

  // Redimensionar ao mudar o tamanho da janela
  window.addEventListener("resize", posicionar);
});

// ================================
// Alternância de tema
// ================================
function alternarTema() {
  const body = document.body;
  const icone = document.getElementById("icone-tema");

  body.classList.toggle("tema-escuro");

  if (body.classList.contains("tema-escuro")) {
    icone.src = "/static/img/icons/icon_sun.svg";
    icone.alt = "Modo Claro";
    localStorage.setItem("tema", "escuro");
  } else {
    icone.src = "/static/img/icons/icon_moon.svg";
    icone.alt = "Modo Escuro";
    localStorage.setItem("tema", "claro");
  }
}

// Aplicar tema salvo
document.addEventListener("DOMContentLoaded", () => {
  const temaSalvo = localStorage.getItem("tema");
  const body = document.body;
  const icone = document.getElementById("icone-tema");

  if (temaSalvo === "escuro") {
    body.classList.add("tema-escuro");
    if (icone) {
      icone.src = "/static/img/icons/icon_sun.svg";
      icone.alt = "Modo Claro";
    }
  } else {
    body.classList.remove("tema-escuro");
    if (icone) {
      icone.src = "/static/img/icons/icon_moon.svg";
      icone.alt = "Modo Escuro";
    }
  }

  // Adicionar event listener para o botão de tema
  const botaoTema = document.getElementById("toggle-tema");
  if (botaoTema) {
    botaoTema.addEventListener("click", alternarTema);
  }

  // Adicionar event listener para voltar
  const botaoVoltar = document.querySelector(".btn-voltar");
  if (botaoVoltar) {
    botaoVoltar.addEventListener("click", () => {
      history.back();
    });
  }
});

// ================================
// Alternância entre imagem e mapa (Desktop)
// ================================
function alternarMapa() {
  const imagemPrincipal = document.getElementById("imagemPrincipal");
  const mapaPrincipal = document.getElementById("mapaPrincipal");
  const botao = document.querySelector(".botao-mapa-toggle");

  if (mapaPrincipal.style.display === "block") {
    mapaPrincipal.style.display = "none";
    imagemPrincipal.style.display = "block";
    botao.textContent = "Ver no mapa";
  } else {
    mapaPrincipal.style.display = "block";
    imagemPrincipal.style.display = "none";
    botao.textContent = "Ver imagem";
  }
}

// ================================
// Troca de imagem principal (Desktop)
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const imagemPrincipal = document.getElementById("imagemPrincipal");
  const thumbnails = document.querySelectorAll(".coluna-esquerda .thumb-secundaria");

  if (!imagemPrincipal || thumbnails.length === 0) return;

  thumbnails.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      // Trocar a imagem principal
      const srcOriginal = imagemPrincipal.src;
      imagemPrincipal.src = thumb.src;
      
      // Opcional: trocar a thumbnail clicada pela imagem que estava como principal
      // thumb.src = srcOriginal;
      
      // Adicionar efeito visual de seleção
      thumbnails.forEach(t => t.classList.remove("ativa"));
      thumb.classList.add("ativa");
    });
  });

  // Marcar a primeira thumbnail como ativa por padrão
  if (thumbnails[0]) {
    thumbnails[0].classList.add("ativa");
  }
});