// ================================
// main.js - Carrega imóveis recentes na homepage
// ================================

fetch('/api/imoveis')
  .then(response => response.json())
  .then(imoveis => {
    const lista = document.getElementById('lista-imoveis');
    lista.innerHTML = '';

    // Exibe os 6 imóveis ATIVOS mais recentes (ID maior primeiro)
    const recentes = imoveis
      .filter(imovel => !!imovel.ativo)         // Filtra apenas os ativos
      .sort((a, b) => b.id - a.id)                   // Ordena do mais recente pro mais antigo
      .slice(0, 6);                                  // Pega os 6 primeiros

    recentes.forEach(imovel => {
      lista.innerHTML += `
        <div class="imovel-card">

          <a href="/imovel/${imovel.id}" class="card-link">
          
            <img src="${imovel.imagem}" alt="${imovel.titulo}">
            <h2>${imovel.titulo}</h2>
            <h3>${imovel.descricao}</h3>
            <p class="preço">R$${imovel.preco}</p>
          </a>
        </div>
      `;
    });
  });
