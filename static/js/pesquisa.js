// Formata o texto
 const maxPrecoInput = document.getElementById('max_preco');

  maxPrecoInput.addEventListener('input', function () {
    let valor = this.value;

    // Remove tudo que não for número
    valor = valor.replace(/\D/g, '');

    // Converte para número com separador de milhar
    if (valor) {
      valor = parseInt(valor).toLocaleString('pt-BR');
    }

    this.value = valor;
  });