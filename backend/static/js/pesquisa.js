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

  if (entregaInput && estagioSelect) {
    function atualizarCampoEntrega() {
      entregaInput.disabled = estagioSelect.value !== 'EM CONSTRUÇÃO';
    }

    estagioSelect.addEventListener('change', atualizarCampoEntrega);
    atualizarCampoEntrega(); // ao carregar a página
  }

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

  // ================================
  // Pesquisa rápida em tempo real
  // ================================
  const termoInput = document.getElementById('termo-pesquisa');
  const sugestoesBox = document.getElementById('sugestoes-pesquisa');
  const btnLimpar = document.getElementById('limpar-pesquisa');
  const contadorImoveis = document.querySelector('.contador-imoveis');

  // Sugestões dinâmicas (igual ao index)
  if (termoInput && sugestoesBox) {
    termoInput.addEventListener("input", () => {
      const query = termoInput.value.trim();

      // Filtrar imóveis em tempo real
      filtrarImoveis();

      // Mostrar sugestões se tiver mais de 2 caracteres
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
              filtrarImoveis(); // Filtrar após selecionar sugestão
            });
            sugestoesBox.appendChild(div);
          });
          sugestoesBox.style.display = "block";
        });
    });

    // Fechar sugestões ao clicar fora
    document.addEventListener("click", (e) => {
      if (!sugestoesBox.contains(e.target) && e.target !== termoInput) {
        sugestoesBox.style.display = "none";
      }
    });
  }

  function filtrarImoveis() {
    const termo = termoInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.card-link');
    let visiveisCount = 0;
    let empreendimentosVisiveis = 0;
    let imoveisVisiveis = 0;

    cards.forEach(card => {
      let textoCard = '';
      
      // Para imóveis, incluir dados específicos incluindo o título
      if (!card.classList.contains('card-empreendimento-link')) {
        // Pegar o título do imóvel do atributo alt da imagem
        const imagem = card.querySelector('.card-imagem img');
        const titulo = imagem ? imagem.getAttribute('alt') || '' : '';
        
        // Pegar outros dados específicos dos imóveis
        const tipo = card.querySelector('.card-info_principal h1')?.textContent || '';
        const id = card.querySelector('.card-info_principal h2')?.textContent || '';
        const pretensao = card.querySelector('.pretensao')?.textContent || '';
        const bairro = card.querySelector('.bairro')?.textContent || '';
        const cidade = card.querySelector('.cidade')?.textContent || '';
        const preco = card.querySelector('.card-preco p')?.textContent || '';
        
        // Combinar todos os dados para busca, incluindo o título
        textoCard = `${titulo} ${tipo} ${id} ${pretensao} ${bairro} ${cidade} ${preco}`.toLowerCase();
      } else {
        // Para empreendimentos, usar todo o texto visível
        textoCard = card.textContent.toLowerCase();
      }
      
      const isVisible = !termo || textoCard.includes(termo);

      if (isVisible) {
        card.style.display = 'block';
        visiveisCount++;
        
        // Contar por tipo
        if (card.classList.contains('card-empreendimento-link')) {
          empreendimentosVisiveis++;
        } else {
          imoveisVisiveis++;
        }
      } else {
        card.style.display = 'none';
      }
    });

    // Atualizar contador
    atualizarContador(visiveisCount, empreendimentosVisiveis, imoveisVisiveis);

    // Mostrar/esconder mensagem de "nenhum resultado"
    const nenhumEncontrado = document.querySelector('.nenhum-encontrado');
    if (nenhumEncontrado) {
      nenhumEncontrado.style.display = visiveisCount === 0 ? 'block' : 'none';
    }
  }

  function atualizarContador(total, empreendimentos, imoveis) {
    let texto = `${total} ${total > 1 ? 'resultados' : 'resultado'} ${total > 1 ? 'encontrados' : 'encontrado'}`;
    
    if (empreendimentos > 0 && imoveis > 0) {
      texto += ` (${empreendimentos} ${empreendimentos > 1 ? 'empreendimentos' : 'empreendimento'} e ${imoveis} ${imoveis > 1 ? 'imóveis' : 'imóvel'})`;
    } else if (empreendimentos > 0) {
      texto += ` (${empreendimentos} ${empreendimentos > 1 ? 'empreendimentos' : 'empreendimento'})`;
    } else if (imoveis > 0) {
      texto += ` (${imoveis} ${imoveis > 1 ? 'imóveis' : 'imóvel'})`;
    }
    
    contadorImoveis.textContent = texto;
  }

  function limparPesquisa() {
    termoInput.value = '';
    sugestoesBox.style.display = 'none';
    filtrarImoveis();
  }

  // Event listener para botão limpar
  if (btnLimpar) {
    btnLimpar.addEventListener('click', limparPesquisa);
  }
});

