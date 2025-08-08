// ================================
// dashboard.js - Bresolin Imóveis
// ================================

// ----------- Navegação entre seções do painel -----------
const menuItems = document.querySelectorAll('.menu-item');
const views = document.querySelectorAll('.view');

menuItems.forEach(btn => {
  btn.addEventListener('click', () => {
    menuItems.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const target = btn.dataset.target;
    views.forEach(v => v.classList.toggle('active', v.id === target));

    // Lazy loads simples
    if (target === 'view-imoveis') {
      listarImoveis?.();      // Função do admin.js
      montarDestaques();
      preencherKpis();
    }
    if (target === 'view-cadastro') {
      listarCondominios?.();  // Função do admin.js
    }
    if (target === 'view-info') {
      preencherKpis();
    }
  });
});

// ----------- Atualizar lista manualmente -----------
document.getElementById('btn-atualizar')?.addEventListener('click', () => {
  listarImoveis?.();
  montarDestaques();
  preencherKpis();
});

// ----------- Filtro de busca (client-side) -----------
document.getElementById('busca-imoveis')?.addEventListener('input', (e) => {
  const termo = e.target.value.toLowerCase().trim();
  const cards = document.querySelectorAll('#lista-admin .imovel-admin, #lista-admin .card');
  cards.forEach(c => {
    const txt = c.innerText.toLowerCase();
    c.style.display = txt.includes(termo) ? '' : 'none';
  });
});

// ----------- Botão limpar form de cadastro/edição -----------
document.getElementById('btn-limpar-form')?.addEventListener('click', () => {
  const form = document.getElementById('form-imovel');
  form?.reset();
  document.getElementById('lista-secundarias').innerHTML = '';
  document.getElementById('lista-plantas').innerHTML = '';
  const preview = document.getElementById('preview-imagem');
  if (preview) preview.src = '';
});

// Função para abrir o modal de seleção de destaques
async function abrirModalDestaque() {
  const modal = document.getElementById('modal-destaque');
  const lista = document.getElementById('lista-destaque-modal');
  lista.innerHTML = 'Carregando...';

  // Busca todos os imóveis
  const imoveis = await fetch('/api/imoveis').then(r => r.json());

  // Filtra apenas imóveis ativos
  const ativos = imoveis.filter(imovel => !!imovel.ativo);

  // Monta lista de seleção
  lista.innerHTML = '';
  ativos.forEach(imovel => {
    const div = document.createElement('div');
    div.className = 'item-destaque';
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${imovel.id}" ${imovel.destaque ? 'checked' : ''}>
        ${imovel.titulo || 'Sem título'} (ID ${imovel.id})
      </label>
    `;
    lista.appendChild(div);
  });

  modal.style.display = 'block';
}

// ----------- Modal de seleção de destaques -----------
function adicionarEventoBotaoDestaque() {
  const btn = document.getElementById('btn-add-destaque');
  if (btn) {
    btn.onclick = abrirModalDestaque;
  }
}

// ----------- Salva destaques selecionados -----------
document.getElementById('btn-salvar-destaques')?.addEventListener('click', async () => {
  const modal = document.getElementById('modal-destaque');
  const checks = modal.querySelectorAll('input[type="checkbox"]:checked');
  const ids = Array.from(checks).map(cb => parseInt(cb.value));

  if (ids.length > 6) {
    alert('Selecione no máximo 6 imóveis!');
    return;
  }

  let data;
  try {
    const response = await fetch('/api/imoveis/destaque', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ids})
    });
    data = await response.json();

    if (response.ok && data.sucesso) {
      alert('Destaques atualizados!');
      modal.style.display = 'none';
    } else if (data.erro) {
      alert(data.erro);
      return;
    }
  } catch (err) {
    console.error("Erro na requisição:", err);
    alert('Erro de conexão com o servidor.');
    return;
  }

  // Atualiza destaques e KPIs fora do try/catch
  montarDestaques();
  preencherKpis();
});

// ----------- Monta os cards de destaque no grid -----------
async function montarDestaques() {
  const destaquesGrid = document.getElementById('destaques-grid');
  const contDestaques = document.getElementById('cont-destaques');
  if (!destaquesGrid) return;

  // Mantém o botão "+" sempre presente
  destaquesGrid.innerHTML = `
    <div class="card add-card" id="btn-add-destaque" title="Adicionar destaque">
      <span>+</span>
    </div>
  `;
  adicionarEventoBotaoDestaque();

  // Busca e exibe os imóveis em destaque
  const imoveis = await fetch('/api/imoveis').then(r => r.json());
  const destaques = imoveis.filter(imovel => !!imovel.destaque && !!imovel.ativo).slice(0, 6);
  contDestaques.textContent = `${destaques.length}/6`;

  for (const imovel of destaques) {
    // Busca o mini card HTML igual ao da pesquisa
    const html = await fetch(`/api/card/${imovel.id}`).then(res => res.text());
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const card = temp.firstElementChild;
    // Adiciona o card antes do botão "+"
    destaquesGrid.insertBefore(card, destaquesGrid.firstChild);
  }
}

// Função para criar card de imóvel (usada em listarImoveis)
function criarCardImovel(imovel) {
  const ativo = !!imovel.ativo;
  const card = document.createElement('div');
  card.className = 'card imovel-admin';
  card.innerHTML = `
    <div class="thumb">
      <img src="${imovel.imagem && imovel.imagem.trim() !== "" ? imovel.imagem : '/static/img/casa.png'}" 
           alt="${imovel.titulo || 'Sem título'}">
    </div>
    <div class="title">${imovel.titulo || 'Sem título'} <small>(ID ${imovel.id})</small></div>
    <div class="meta">${ativo ? 'Ativo' : 'Inativo'}</div>
    <div class="card-actions">
      <button class="${ativo ? 'desativar' : 'ativar'}">${ativo ? 'Desativar' : 'Ativar'}</button>
      <button class="excluir">Excluir</button>
    </div>
  `;
  // Card link para edição (igual ao JS antigo)
  card.onclick = (e) => {
    if (e.target.closest('.card-actions')) return;
    window.location.href = `/admin/imovel/${imovel.id}/editar`;
  };
  // Ativar/Desativar
  card.querySelector('.ativar, .desativar').onclick = async (e) => {
    e.stopPropagation();
    await fetch(`/api/imoveis/${imovel.id}/${ativo ? 'desativar' : 'ativar'}`, {method: 'POST'});
    listarImoveis();
    montarDestaques();
    preencherKpis();
  };
  // Excluir
  card.querySelector('.excluir').onclick = async (e) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
    await fetch(`/api/imoveis/${imovel.id}`, {method: 'DELETE'});
    listarImoveis();
    montarDestaques();
    preencherKpis();
  };
  return card;
}

// Atualize listarImoveis para usar criarCardImovel
async function listarImoveis() {
  const lista = document.getElementById('lista-admin');
  if (!lista) return;
  lista.innerHTML = 'Carregando...';
  const imoveis = await fetch('/api/imoveis').then(r => r.json());
  lista.innerHTML = '';
  imoveis.forEach(imovel => lista.appendChild(criarCardImovel(imovel)));
}

// ----------- Inicialização do painel -----------
(function init(){
  listarImoveis?.();
  montarDestaques();
  preencherKpis();
  listarCondominios?.();
  adicionarEventoBotaoDestaque();
})();

async function preencherKpis() {
  // Busca todos os imóveis
  const imoveis = await fetch('/api/imoveis').then(r => r.json());

  // Total de imóveis
  const total = imoveis.length;

  // Imóveis ativos
  const ativos = imoveis.filter(imovel => !!imovel.ativo).length;

  // Imóveis em destaque
  const destaques = imoveis.filter(imovel => !!imovel.destaque && !!imovel.ativo).length;

  // Atualiza os KPIs na tela
  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-ativos').textContent = ativos;
  document.getElementById('kpi-destaques').textContent = destaques;
}