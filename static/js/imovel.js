// ================================
// Visualizador de imagens estilo galeria
// ================================

document.addEventListener("DOMContentLoaded", () => {
  const imagens = Array.from(document.querySelectorAll(".thumb-secundaria"));
  if (imagens.length === 0) return;

  // Cria o visualizador
  const viewer = document.createElement("div");
  viewer.id = "imagem-viewer";
  viewer.innerHTML = `
    <button class="fechar">&times;</button>
    <button class="navegacao prev">&#10094;</button>
    <img>
    <button class="navegacao next">&#10095;</button>
  `;
  document.body.appendChild(viewer);

  const imgTag = viewer.querySelector("img");
  let atual = 0;

  function abrir(index) {
    atual = index;
    imgTag.src = imagens[atual].src;
    viewer.style.display = "flex";
  }

  function fechar() {
    viewer.style.display = "none";
    imgTag.src = "";
  }

  function proxima() {
    atual = (atual + 1) % imagens.length;
    imgTag.src = imagens[atual].src;
  }

  function anterior() {
    atual = (atual - 1 + imagens.length) % imagens.length;
    imgTag.src = imagens[atual].src;
  }

  imagens.forEach((img, index) => {
    img.addEventListener("click", () => abrir(index));
  });

  viewer.querySelector(".fechar").addEventListener("click", fechar);
  viewer.querySelector(".next").addEventListener("click", proxima);
  viewer.querySelector(".prev").addEventListener("click", anterior);

  // Fecha com tecla Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fechar();
  });
});
