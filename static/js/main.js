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

    paths.forEach((path, index) => {
      const length = path.getTotalLength();

      // Define dasharray e offset
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;

      // Anima após o delay adequado
      setTimeout(() => {
        path.style.transition = `stroke-dashoffset ${DURATION}ms ease-out`;
        path.style.strokeDashoffset = "0";
      }, index * DURATION);
    });

    // Remove loader após tudo terminar
    const totalTime = paths.length * DURATION;
    setTimeout(() => {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 600); // tempo do fade
    }, totalTime + 200);
  });

// ================================
// slot-machine
// ================================
const palavras = [
  "Casas", "Casas", "Casas", "Casas", "Casas", "Casas", "Casas", "Casas", "Casas",
  "Preços", "Preços", "Preços", "Preços", "Preços", "Preços", "Preços", "Preços", "Preços",
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
  // troca 1 → durante o "apagar da direita" (35% do tempo)
  setTimeout(() => {
    animateSlot();
  }, 3600);

  // troca 2 → durante o "apagar da esquerda" (85% do tempo)
  setTimeout(() => {
    animateSlot();
  }, 8600);

  // reinicia o ciclo
  setTimeout(agendarTrocasSincronizadas, 10000);
}

$(function () {
  buildSlot();

  // centraliza na primeira palavra
  const start = (repeticoes * palavras.length / 2);
  $container.css("top", `-${start * 3.5}rem`);

  agendarTrocasSincronizadas(); // inicia tudo!
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