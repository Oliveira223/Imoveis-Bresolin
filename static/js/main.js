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