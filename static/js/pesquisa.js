//==================
// Formata o texto automaticamente
//==================
const precoEditavel = document.getElementById('preco-editavel');
const precoReal = document.getElementById('max_preco_real');

// Formatação ao digitar
precoEditavel.addEventListener('input', function () {
  // Remove ,00 se já existir e todos os não dígitos
  let texto = this.innerText.replace(',00', '').replace(/\D/g, '');

  if (texto) {
    // Formata com separador de milhar + adiciona ,00 no final
    let formatado = parseInt(texto).toLocaleString('pt-BR') + ',00';

    // Atualiza visualmente
    this.innerText = formatado;

    // Atualiza campo oculto sem formatação para o backend
    precoReal.value = texto;

    // Reposiciona o cursor antes da vírgula
    placeCaretBeforeComma(this);
  } else {
    // Limpa campo se não houver nada
    this.innerText = '';
    precoReal.value = '';
  }
});

// Mantém o cursor antes da vírgula
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

// ===========================
// Garante envio correto no formulário
// ===========================
document.querySelector('form').addEventListener('submit', function () {
  let texto = precoEditavel.innerText.replace(',00', '').replace(/\D/g, '');
  if (texto) {
    precoReal.value = texto; // número puro (ex: "250000")
  } else {
    precoReal.value = '';
  }
});

// Envia o formulário ao pressionar Enter dentro do campo editável
precoEditavel.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault(); // impede quebra de linha
    document.querySelector('form').requestSubmit(); // envia o formulário
  }
});


// Ativa ou desativa o campo "Ano de entrega" com base no estágio da obra
const estagioSelect = document.getElementById('estagio');
const entregaInput = document.getElementById('entrega');

// Função para atualizar o estado do campo de entrega
function atualizarCampoEntrega() {
  entregaInput.disabled = estagioSelect.value === 'PRONTA';
}

// Executa quando o usuário muda o valor
estagioSelect.addEventListener('change', atualizarCampoEntrega);

// Executa ao carregar a página (ex: quando filtro já vem preenchido)
window.addEventListener('DOMContentLoaded', atualizarCampoEntrega);