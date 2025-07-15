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