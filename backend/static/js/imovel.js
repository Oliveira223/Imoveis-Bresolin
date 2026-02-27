// ================================
// Galeria Unificada com Navegação por Setas
// ================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. Coleta todas as imagens da galeria (Principal + Secundárias)
  const thumbs = Array.from(document.querySelectorAll(".coluna-esquerda .thumb-galeria, .mobile .thumb-galeria"));
  // Remove duplicatas de URL mantendo a ordem (caso o mesmo seletor pegue mobile e desktop)
  const urlsGaleria = [...new Set(thumbs.map(img => img.src))];
  
  const imgPrincipalDesktop = document.getElementById("imagemPrincipal");
  const imgPrincipalMobile = document.querySelector(".mobile .imagem-principal");
  const contadorMobile = document.querySelector(".contador-fotos-mobile");
  
  let indiceAtual = 0;

  // ================================
  // Funções de Navegação
  // ================================

  window.atualizarVisualizacaoGaleria = (novoIndice) => {
    if (novoIndice < 0) novoIndice = urlsGaleria.length - 1;
    if (novoIndice >= urlsGaleria.length) novoIndice = 0;
    
    indiceAtual = novoIndice;
    const novaUrl = urlsGaleria[indiceAtual];

    // Atualiza imagem principal no Desktop
    if (imgPrincipalDesktop) {
      imgPrincipalDesktop.src = novaUrl;
      imgPrincipalDesktop.dataset.index = indiceAtual;
    }

    // Atualiza imagem principal no Mobile
    if (imgPrincipalMobile) {
      imgPrincipalMobile.src = novaUrl;
      imgPrincipalMobile.dataset.index = indiceAtual;
    }

    // Atualiza contador no Mobile
    if (contadorMobile) {
      contadorMobile.textContent = `${indiceAtual + 1} / ${urlsGaleria.length}`;
    }

    // Destaca a miniatura ativa (Desktop)
    document.querySelectorAll(".coluna-esquerda .thumb-galeria").forEach((thumb, i) => {
      thumb.classList.toggle("ativa", i === indiceAtual);
    });
  };

  window.navegarSlideMobile = (direcao) => {
    atualizarVisualizacaoGaleria(indiceAtual + direcao);
  };

  window.navegarSlideDesktop = (direcao) => {
    atualizarVisualizacaoGaleria(indiceAtual + direcao);
  };

  // Clique nas miniaturas
  document.querySelectorAll(".thumb-galeria").forEach((thumb) => {
    thumb.addEventListener("click", function() {
      const index = parseInt(this.dataset.index);
      if (!isNaN(index)) {
        atualizarVisualizacaoGaleria(index);
      }
    });
  });

  // ================================
  // Visualizador Fullscreen (Modal)
  // ================================
  const viewer = document.createElement("div");
  viewer.id = "imagem-viewer";
  viewer.innerHTML = `
    <button class="fechar"><img src="/static/img/icons/close.svg" alt="Fechar"></button>
    <button class="navegacao prev"><img src="/static/img/icons/arrow-left.svg" alt="Anterior"></button>
    <div class="imagem-scroll-container"></div>
    <button class="navegacao next"><img src="/static/img/icons/arrow-right.svg" alt="Próxima"></button>
  `;
  document.body.appendChild(viewer);

  const scrollContainer = viewer.querySelector(".imagem-scroll-container");

  // Clona todas as imagens para o modal
  urlsGaleria.forEach((url) => {
    const clone = document.createElement("img");
    clone.src = url;
    clone.classList.add("imagem-fullscreen");
    scrollContainer.appendChild(clone);
  });

  const imagensFullscreen = scrollContainer.querySelectorAll(".imagem-fullscreen");

  function abrirModal(index) {
    indiceAtual = index;
    viewer.style.display = "flex";
    document.body.classList.add("modal-aberto");
    sincronizarScrollModal();
  }

  function sincronizarScrollModal() {
    if (imagensFullscreen[indiceAtual]) {
      imagensFullscreen[indiceAtual].scrollIntoView({
        behavior: "auto",
        inline: "center",
        block: "nearest"
      });
    }
  }

  function fecharModal() {
    viewer.style.display = "none";
    document.body.classList.remove("modal-aberto");
    // Ao fechar o modal, sincroniza a galeria da página com a última imagem vista
    atualizarVisualizacaoGaleria(indiceAtual);
  }

  function proximaModal() {
    indiceAtual = (indiceAtual + 1) % imagensFullscreen.length;
    imagensFullscreen[indiceAtual].scrollIntoView({ behavior: "smooth", inline: "center" });
  }

  function anteriorModal() {
    indiceAtual = (indiceAtual - 1 + imagensFullscreen.length) % imagensFullscreen.length;
    imagensFullscreen[indiceAtual].scrollIntoView({ behavior: "smooth", inline: "center" });
  }

  // Eventos do Modal
  viewer.querySelector(".fechar").onclick = fecharModal;
  viewer.querySelector(".next").onclick = proximaModal;
  viewer.querySelector(".prev").onclick = anteriorModal;

  // Abrir modal ao clicar na imagem principal (Desktop e Mobile)
  if (imgPrincipalDesktop) imgPrincipalDesktop.onclick = () => abrirModal(indiceAtual);
  if (imgPrincipalMobile) imgPrincipalMobile.onclick = () => abrirModal(indiceAtual);

  // Inicializa a primeira thumbnail como ativa
  atualizarVisualizacaoGaleria(0);
});
