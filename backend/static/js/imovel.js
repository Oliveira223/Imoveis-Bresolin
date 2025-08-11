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

    const targetImage = imagensFullscreen[atual];
    targetImage.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: "nearest"
    });
  }

  // ================================
  // Fechar visualizador
  // ================================
  function fechar() {
    viewer.style.display = "none";
    document.body.classList.remove("modal-aberto");
  }

  // ================================
  // Navegação com botões
  // ================================
  function proxima() {
    atual = (atual + 1) % imagensFullscreen.length;
    imagensFullscreen[atual].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }

  function anterior() {
    atual = (atual - 1 + imagensFullscreen.length) % imagensFullscreen.length;
    imagensFullscreen[atual].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }

  // ================================
  // Eventos
  // ================================
  imagens.forEach((img, index) => {
    img.addEventListener("click", () => abrir(index));
  });

  viewer.querySelector(".fechar").addEventListener("click", fechar);
  viewer.querySelector(".next").addEventListener("click", proxima);
  viewer.querySelector(".prev").addEventListener("click", anterior);

  // Tecla Esc fecha o visualizador
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fechar();
  });

  // ================================
  // Atualiza índice ao rolar manualmente
  // ================================
  scrollContainer.addEventListener("scroll", () => {
    const scrollLeft = scrollContainer.scrollLeft;
    let maisProxima = 0;
    let menorDistancia = Infinity;

    imagensFullscreen.forEach((img, i) => {
      const distancia = Math.abs(img.offsetLeft - scrollLeft);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        maisProxima = i;
      }
    });

    atual = maisProxima;
  });
});

// ================================
// Modo Escuro
// ================================
function alternarTema() {
  const body = document.body;
  const icone = document.getElementById("icone-tema");

  body.classList.toggle("modo-escuro");

  if (body.classList.contains("modo-escuro")) {
    icone.src = "/static/img/icons/icon_sun.svg";
    icone.alt = "Modo Claro";
    localStorage.setItem("tema", "escuro");
  } else {
    icone.src = "/static/img/icons/icon_moon.svg";
    icone.alt = "Modo Escuro";
    localStorage.setItem("tema", "claro");
  }
}

// Aplica tema salvo anteriormente
document.addEventListener("DOMContentLoaded", () => {
  const temaSalvo = localStorage.getItem("tema");
  const body = document.body;
  const icone = document.getElementById("icone-tema");

  // if (temaSalvo === "claro") {
  //   body.classList.remove("modo-escuro");
  //   if (icone) {
  //     icone.src = "/static/img/icons/icon_moon.svg";
  //     icone.alt = "Modo Escuro";
  //   }
  // } else {
  //   body.classList.add("modo-escuro"); // Padrão: escuro
  //   if (icone) {
  //     icone.src = "/static/img/icons/icon_sun.svg";
  //     icone.alt = "Modo Claro";
  //   }
  // }


  // PADRÃO CLARO
    if (temaSalvo === "escuro") {
    body.classList.add("modo-escuro");
    if (icone) {
      icone.src = "/static/img/icons/icon_sun.svg";
      icone.alt = "Modo Claro";
    }
  } else {
    body.classList.remove("modo-escuro"); 
    if (icone) {
      icone.src = "/static/img/icons/icon_moon.svg";
      icone.alt = "Modo Escuro";
    }
  }
});



function alternarMapa() {
  const img = document.getElementById("imagemPrincipal");
  const mapa = document.getElementById("mapaPrincipal");
  const botao = document.querySelector(".botao-mapa-toggle");

  if (img.style.display !== "none") {
    img.style.display = "none";
    mapa.style.display = "block";
    botao.textContent = "Ver imagem";
  } else {
    img.style.display = "block";
    mapa.style.display = "none";
    botao.textContent = "Ver no mapa";
  }
}


// ================================
// Fullscreen da imagem principal
// ================================
// ================================
// Visualizador simples da imagem principal
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("imagemPrincipal");

  if (img) {
    // Cria o visualizador
    const viewer = document.createElement("div");
    viewer.id = "viewer-principal";
    viewer.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.95);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const imagemAmpliada = document.createElement("img");
    imagemAmpliada.style.cssText = `
      max-width: 90vw;
      max-height: 90vh;
      border-radius: 8px;
    `;

    viewer.appendChild(imagemAmpliada);
    document.body.appendChild(viewer);

    // Abrir
    img.addEventListener("click", () => {
      imagemAmpliada.src = img.src;
      viewer.style.display = "flex";
      document.body.classList.add("modal-aberto");
    });

    // Fechar ao clicar fora
    viewer.addEventListener("click", (e) => {
      if (e.target === viewer) {
        viewer.style.display = "none";
        document.body.classList.remove("modal-aberto");
      }
    });

    // Fechar com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        viewer.style.display = "none";
        document.body.classList.remove("modal-aberto");
      }
    });
  }
});