document.addEventListener('DOMContentLoaded', () => {
  // ================================
  // Tela de carregamento
  // ================================
  const paths = [
    document.getElementById("path-1"),
    document.getElementById("path-2"),
  ];

  const loader = document.querySelector(".loading-container");
  const DURATION = 800;

  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    setTimeout(() => {
      path.style.transition = `stroke-dashoffset ${DURATION}ms ease-out`;
      path.style.strokeDashoffset = "0";
    }, index * DURATION);
  });

  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 600);
  }, paths.length * DURATION + 200);

  // ================================
  // Preço editável formatado
  // ================================
  const precoEditavel = document.getElementById('preco-editavel');
  const precoReal = document.getElementById('max_preco_real');

  precoEditavel.addEventListener('input', function () {
    let texto = this.innerText.replace(',00', '').replace(/\D/g, '');

    if (texto) {
      let formatado = parseInt(texto).toLocaleString('pt-BR') + ',00';
      this.innerText = formatado;
      precoReal.value = texto;
      placeCaretBeforeComma(this);
    } else {
      this.innerText = '';
      precoReal.value = '';
    }
  });

  precoEditavel.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.querySelector('form').requestSubmit();
    }
  });

  function placeCaretBeforeComma(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    const node = el.firstChild;
    if (!node) return;
    const index = node.textContent.indexOf(',');
    range.setStart(node, index);
    range.setEnd(node, index);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  document.querySelector('form').addEventListener('submit', function () {
    let texto = precoEditavel.innerText.replace(',00', '').replace(/\D/g, '');
    precoReal.value = texto || '';
  });

  // ================================
  // Habilitar/desabilitar campo entrega
  // ================================
  const estagioSelect = document.getElementById('estagio');
  const entregaInput = document.getElementById('entrega');

  function atualizarCampoEntrega() {
  entregaInput.disabled = estagioSelect.value !== 'EM CONSTRUÇÃO';
}

  estagioSelect.addEventListener('change', atualizarCampoEntrega);
  atualizarCampoEntrega(); // ao carregar a página

  // ================================
  // Botão "Filtrar Imóveis" no mobile
  // ================================
  const btnToggle = document.getElementById('btn-toggle-filtros');
  const filtros = document.querySelector('.filtros');

  if (btnToggle && filtros) {
    btnToggle.addEventListener('click', () => {
      filtros.classList.toggle('ativo');
      btnToggle.textContent = filtros.classList.contains('ativo')
        ? 'Fechar Filtros ▲'
        : 'Filtrar Imóveis ▼';
    });
  }
});