// ================================
// tela de carregamento
// ================================
window.addEventListener("DOMContentLoaded", () => {
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
      //ativa o scroll
      document.body.classList.remove("no-scroll");
      document.documentElement.classList.remove("no-scroll");
    }, 600); // tempo do fade
  }, totalTime + 200);


  // ================================
  // slot-machine
  // ================================
  const palavras = [
    "Casas", "Casas", "Casas", "Casas", "Casas", "Casas", "Casas", "Casas", "Casas",
    "Apartamentos", "Apartamentos", "Apartamentos", "Apartamentos", "Apartamentos", "Apartamentos", "Apartamentos", "Apartamentos", "Apartamentos", "Apartamentos", "Apartamentos",
    "Imóveis", "Imóveis", "Imóveis", "Imóveis", "Imóveis", "Imóveis", "Imóveis", "Imóveis", "Imóveis"
  ];

  const $container = $("#slot-container");
  const repeticoes = 100;
  let currentIndex = 0;

  function buildSlot() {
    for (let i = 0; i < repeticoes; i++) {
      palavras.forEach(palavra => {
        $container.append($('<div>').addClass("slottt-machine__item").text(palavra));
      });
    }
  }

  function animateSlot() {
    currentIndex = (currentIndex + 10) % palavras.length;
    const destino = (repeticoes * palavras.length / 2 + currentIndex);
    const offset = -destino * 3.5; // altura da palavra em rem

    $container.animate(
      { top: `${offset}rem` },
      2000,
      "easeOutCubic"
    );
  }

  // easing customizado
  $.easing.easeOutCubic = function (x, t, b, c, d) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  };

  // agenda as trocas sincronizadas com o underline
  function agendarTrocasSincronizadas() {
    setTimeout(() => {
      animateSlot();
    }, 3600);

    setTimeout(() => {
      animateSlot();
    }, 8600);

    setTimeout(agendarTrocasSincronizadas, 10000);
  }

  $(function () {
    buildSlot();

    const start = (repeticoes * palavras.length / 2);
    $container.css("top", `-${start * 3.5}rem`);

    agendarTrocasSincronizadas();
  });


  // ================================
  // main.js - Carrega imóveis recentes na homepage
  // ================================
  fetch('/api/imoveis')
    .then(res => res.json())
    .then(imoveis => {
      const lista = document.getElementById('lista-imoveis');
      lista.innerHTML = '';

      const recentes = imoveis
        .filter(imovel => !!imovel.ativo)
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 6);

      recentes.forEach(imovel => {
        fetch(`/api/card/${imovel.id}`)
          .then(res => res.text())
          .then(html => {
            lista.innerHTML += html;
          });
      });
    });
});
