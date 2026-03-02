// ================================
// main.js - Bresolin Imóveis
// ================================

window.addEventListener("DOMContentLoaded", () => {
  // ================================
  // Tela de carregamento animada
  // ================================
  const paths = [
    document.getElementById("path-1"),
    document.getElementById("path-2"),
  ];

  const loader = document.querySelector(".loading-container");
  const DURATION = 800; // tempo em ms para cada parte
  const totalTime = paths.length * DURATION;

  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    setTimeout(() => {
      path.style.transition = `stroke-dashoffset ${DURATION}ms ease-out`;
      path.style.strokeDashoffset = "0";
    }, index * DURATION);
  });

  // Remove loader após tudo terminar
  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.remove();
      // Ativa o scroll
      document.body.classList.remove("no-scroll");
      document.documentElement.classList.remove("no-scroll");
    }, 600); // tempo do fade
  }, totalTime + 200);

  // ================================
  // Carrega imóveis em destaque na homepage (OTIMIZADO)
  // ================================
  const listaDestaques = document.getElementById('lista-destaques');
  if (listaDestaques) {
    // Adiciona loading state se necessário
    listaDestaques.innerHTML = '<div class="loading-placeholder">Carregando destaques...</div>';
    
    fetch('/api/imoveis/destaques')
      .then(res => res.text())
      .then(html => {
        if (!html.trim()) {
          listaDestaques.innerHTML = '<p class="sem-destaques">Nenhum imóvel em destaque no momento.</p>';
          return;
        }
        // Injeta o HTML renderizado pelo servidor de uma vez
        listaDestaques.innerHTML = html;
      })
      .catch(err => {
        console.error("Erro ao carregar destaques:", err);
        listaDestaques.innerHTML = '<p class="erro-destaques">Erro ao carregar destaques.</p>';
      });
  }

  // ================================
  // Sugestões de pesquisa dinâmica
  // ================================
  const termoInput = document.getElementById("termo");
  const sugestoesBox = document.getElementById("sugestoes-termo");

  if (termoInput && sugestoesBox) {
    termoInput.addEventListener("input", () => {
      const query = termoInput.value.trim();

      if (query.length < 2) {
        sugestoesBox.style.display = "none";
        return;
      }

      fetch(`/api/sugestoes?query=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          sugestoesBox.innerHTML = "";
          if (data.length === 0) {
            sugestoesBox.style.display = "none";
            return;
          }
          data.forEach(item => {
            const div = document.createElement("div");
            div.textContent = item;
            div.addEventListener("click", () => {
              termoInput.value = item;
              sugestoesBox.style.display = "none";
            });
            sugestoesBox.appendChild(div);
          });
          sugestoesBox.style.display = "block";
        });
    });

    document.addEventListener("click", (e) => {
      if (!sugestoesBox.contains(e.target) && e.target !== termoInput) {
        sugestoesBox.style.display = "none";
      }
    });
  }
});