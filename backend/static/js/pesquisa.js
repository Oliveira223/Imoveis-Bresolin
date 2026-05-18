function escaparHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

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

  if (precoEditavel) {
    precoEditavel.addEventListener('input', function () {
      let texto = this.innerText.replace(',00', '').replace(/\D/g, '');

      if (texto) {
        const numero = parseInt(texto);
        this.innerText = numero.toLocaleString('pt-BR') + ',00';
        precoReal.value = numero;
        placeCaretBeforeComma(this);
      } else {
        this.innerText = '0,00';
        precoReal.value = '';
      }

      aplicarFiltrosCompletos();
    });

    precoEditavel.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
  }

  document.getElementById('form-filtros')?.addEventListener('submit', function () {
    const texto = precoEditavel?.innerText.replace(',00', '').replace(/\D/g, '') || '';
    if (precoReal) precoReal.value = texto;
  });

  // ================================
  // Tabs Compra / Aluguel
  // ================================
  const pretensaoInput = document.getElementById('pretensao');
  const tabBtns = document.querySelectorAll('.tab-btn');

  const resultadosEl = document.querySelector('.resultados');

  // Indicador deslizante do segmented control
  const tabsEl = document.querySelector('.tabs-pretensao');
  let indicador = null;

  function posicionarIndicador(btn, comTransicao = true) {
    if (!indicador || !tabsEl) return;
    if (!comTransicao) indicador.style.transition = 'none';
    indicador.style.left   = btn.offsetLeft   + 'px';
    indicador.style.top    = btn.offsetTop    + 'px';
    indicador.style.width  = btn.offsetWidth  + 'px';
    indicador.style.height = btn.offsetHeight + 'px';
    if (!comTransicao) requestAnimationFrame(() => { indicador.style.transition = ''; });
  }

  if (tabsEl) {
    indicador = document.createElement('div');
    indicador.className = 'tabs-indicador';
    tabsEl.prepend(indicador);
    const btnAtivo = tabsEl.querySelector('.tab-btn.ativo');
    if (btnAtivo) posicionarIndicador(btnAtivo, false);
  }

  function animarTroca(callback) {
    if (!resultadosEl) { callback(); return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    resultadosEl.style.opacity = '0';
    resultadosEl.style.transform = 'translateY(8px)';
    setTimeout(() => {
      callback();
      resultadosEl.style.opacity = '1';
      resultadosEl.style.transform = 'translateY(0)';
    }, 180);
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('ativo'));
      btn.classList.add('ativo');
      if (pretensaoInput) pretensaoInput.value = btn.dataset.valor;
      posicionarIndicador(btn);
      animarTroca(aplicarFiltrosCompletos);
    });
  });

  // ================================
  // Painel de filtros
  // ================================
  const btnAbrirFiltros = document.getElementById('btn-abrir-filtros');
  const painelFiltros = document.getElementById('painel-filtros');

  function fecharPainelFiltros() {
    painelFiltros?.classList.remove('aberto');
    btnAbrirFiltros?.classList.remove('ativo');
  }

  if (btnAbrirFiltros && painelFiltros) {
    btnAbrirFiltros.addEventListener('click', () => {
      const estaAberto = painelFiltros.classList.toggle('aberto');
      btnAbrirFiltros.classList.toggle('ativo', estaAberto);
    });
  }

  document.getElementById('btn-aplicar-filtros')?.addEventListener('click', () => {
    aplicarFiltrosCompletos();
    fecharPainelFiltros();
  });

  document.addEventListener('click', (e) => {
    if (
      painelFiltros?.classList.contains('aberto') &&
      !painelFiltros.contains(e.target) &&
      !btnAbrirFiltros?.contains(e.target)
    ) {
      fecharPainelFiltros();
    }
  });

  // ================================
  // Referências dos filtros do painel
  // ================================
  const termoInput = document.getElementById('termo-pesquisa');
  const sugestoesBox = document.getElementById('sugestoes-pesquisa');
  const btnLimpar = document.getElementById('limpar-pesquisa');

  const tipoSelect = document.getElementById('tipo');
  const localizacaoInput = document.getElementById('localizacao');
  const areaMinInput = document.getElementById('area_min');
  const areaMaxInput = document.getElementById('area_max');
  const quartosInput = document.getElementById('quartos');
  const banheirosInput = document.getElementById('banheiros');
  const vagasInput = document.getElementById('vagas');
  const piscinaCheckbox = document.querySelector('input[name="piscina"]');
  const churrasqueiraCheckbox = document.querySelector('input[name="churrasqueira"]');

  // ================================
  // Utilitário: debounce
  // ================================
  function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
  }

  // ================================
  // Função para atualizar contador
  // ================================
  function atualizarContador(total) {
    const texto = `${total} ${total > 1 ? 'resultados' : 'resultado'} ${total > 1 ? 'encontrados' : 'encontrado'}`;
    document.querySelectorAll('.contador-imoveis').forEach(c => { c.textContent = texto; });
  }

  // ================================
  // Badge de filtros ativos
  // ================================
  function atualizarBadgeFiltros() {
    const ativos = [
      tipoSelect?.value,
      localizacaoInput?.value?.trim(),
      precoReal?.value,
      areaMinInput?.value,
      areaMaxInput?.value,
      quartosInput?.value,
      banheirosInput?.value,
      vagasInput?.value,
      piscinaCheckbox?.checked || false,
      churrasqueiraCheckbox?.checked || false,
    ].filter(v => v && v !== '' && v !== false).length;

    const btn = document.getElementById('btn-abrir-filtros');
    const span = btn?.querySelector('span');
    if (span) span.textContent = ativos > 0 ? `Filtros (${ativos})` : 'Filtros';
    btn?.classList.toggle('com-filtros-ativos', ativos > 0);
  }

  // ================================
  // Função principal de filtragem
  // ================================
  function aplicarFiltrosCompletos() {
    const cards = document.querySelectorAll('.card-link');
    let visiveisCount = 0;
    let empreendimentosVisiveis = 0;
    let imoveisVisiveis = 0;

    const filtros = {
      termo: (termoInput?.value || '').toLowerCase().trim(),
      pretensao: pretensaoInput?.value || '',
      tipo: tipoSelect?.value || '',
      localizacao: localizacaoInput?.value.toLowerCase().trim() || '',
      precoMax: precoReal?.value ? parseInt(precoReal.value) : null,
      areaMin: areaMinInput?.value ? parseFloat(areaMinInput.value) : null,
      areaMax: areaMaxInput?.value ? parseFloat(areaMaxInput.value) : null,
      quartos: quartosInput?.value ? parseInt(quartosInput.value) : null,
      banheiros: banheirosInput?.value ? parseInt(banheirosInput.value) : null,
      vagas: vagasInput?.value ? parseInt(vagasInput.value) : null,
      piscina: piscinaCheckbox?.checked || false,
      churrasqueira: churrasqueiraCheckbox?.checked || false
    };

    const filtrosEspecificosImoveis = filtros.quartos !== null || filtros.banheiros !== null || filtros.vagas !== null || filtros.piscina || filtros.churrasqueira;

    cards.forEach(card => {
      let isVisible = true;
      const isEmpreendimento = card.classList.contains('card-empreendimento-link');

      if (isEmpreendimento && filtrosEspecificosImoveis) isVisible = false;

      if (filtros.termo) {
        let textoCard = '';
        if (!isEmpreendimento) {
          const imagem = card.querySelector('.card-imagem img');
          const titulo = imagem ? imagem.getAttribute('alt') || '' : '';
          const tipo = card.querySelector('.card-info_principal h1')?.textContent || '';
          const id = card.querySelector('.card-info_principal h2')?.textContent || '';
          const pretensao = card.querySelector('.pretensao')?.textContent || '';
          const bairro = card.querySelector('.bairro')?.textContent || '';
          const cidade = card.querySelector('.cidade')?.textContent || '';
          const preco = card.querySelector('.card-preco p')?.textContent || '';
          textoCard = `${titulo} ${tipo} ${id} ${pretensao} ${bairro} ${cidade} ${preco}`.toLowerCase();
        } else {
          textoCard = card.textContent.toLowerCase();
        }
        if (!textoCard.includes(filtros.termo)) isVisible = false;
      }

      if (isVisible && filtros.pretensao) {
        if (isEmpreendimento) {
          isVisible = false;
        } else {
          const pretensaoImovel = card.querySelector('.pretensao')?.textContent.toLowerCase() || '';
          if (!pretensaoImovel.includes(filtros.pretensao.toLowerCase())) isVisible = false;
        }
      }

      if (isVisible && filtros.tipo) {
        if (filtros.tipo === 'empreendimento') {
          if (!isEmpreendimento) isVisible = false;
        } else {
          if (isEmpreendimento) {
            isVisible = false;
          } else {
            const tipoImovel = card.querySelector('.card-info_principal h1')?.textContent.toLowerCase() || '';
            if (!tipoImovel.includes(filtros.tipo.toLowerCase())) isVisible = false;
          }
        }
      }

      if (isVisible && filtros.localizacao) {
        const bairro = card.querySelector('.bairro')?.textContent.toLowerCase() || '';
        const cidade = card.querySelector('.cidade')?.textContent.toLowerCase() || '';
        if (!`${bairro} ${cidade}`.includes(filtros.localizacao)) isVisible = false;
      }

      if (isVisible && filtros.precoMax) {
        const precoTexto = card.querySelector('.card-preco p')?.textContent || '';
        const precoNumero = parseFloat(precoTexto.replace(/[R$\s\.]/g, '').replace(',', '.'));
        if (precoNumero && precoNumero > filtros.precoMax) isVisible = false;
      }

      if (isVisible && !isEmpreendimento) {
        if (filtros.areaMin || filtros.areaMax) {
          const areaElement = card.querySelector('.info-item img[alt="Área"]');
          if (areaElement) {
            const areaTexto = areaElement.parentElement.querySelector('span')?.textContent || '';
            const areaNumero = parseFloat(areaTexto.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (filtros.areaMin && (!areaNumero || areaNumero < filtros.areaMin)) isVisible = false;
            if (filtros.areaMax && areaNumero && areaNumero > filtros.areaMax) isVisible = false;
          } else if (filtros.areaMin) {
            isVisible = false;
          }
        }

        if (filtros.quartos !== null) {
          const el = card.querySelector('.info-item img[alt="Quartos"]');
          const num = el ? parseInt(el.parentElement.querySelector('span')?.textContent.replace(/\D/g, '') || '0') : 0;
          if (!num || num < filtros.quartos) isVisible = false;
        }

        if (filtros.banheiros !== null) {
          const el = card.querySelector('.info-item img[alt="Banheiro"]');
          const num = el ? parseInt(el.parentElement.querySelector('span')?.textContent.replace(/\D/g, '') || '0') : 0;
          if (!num || num < filtros.banheiros) isVisible = false;
        }

        if (filtros.vagas !== null) {
          const el = card.querySelector('.info-item img[alt="Vaga"]');
          const num = el ? parseInt(el.parentElement.querySelector('span')?.textContent.replace(/\D/g, '') || '0') : 0;
          if (!num || num < filtros.vagas) isVisible = false;
        }

        if (filtros.piscina && !card.textContent.toLowerCase().includes('piscina')) isVisible = false;
        if (filtros.churrasqueira && !card.textContent.toLowerCase().includes('churrasqueira')) isVisible = false;
      }

      if (isVisible && isEmpreendimento && (filtros.areaMin || filtros.areaMax)) {
        const areaElement = card.querySelector('.info-item img[alt="Área"]');
        if (areaElement) {
          const areaTexto = areaElement.parentElement.querySelector('span')?.textContent || '';
          if (areaTexto.includes('-')) {
            const partes = areaTexto.split('-');
            const areaMinEmp = parseFloat(partes[0].replace(/[^\d.,]/g, '').replace(',', '.'));
            const areaMaxEmp = parseFloat(partes[1].replace(/[^\d.,]/g, '').replace(',', '.'));
            if (filtros.areaMin && areaMaxEmp < filtros.areaMin) isVisible = false;
            if (filtros.areaMax && areaMinEmp > filtros.areaMax) isVisible = false;
          } else {
            const areaNumero = parseFloat(areaTexto.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (areaTexto.includes('+')) {
              if (filtros.areaMax && areaNumero > filtros.areaMax) isVisible = false;
            } else {
              if (filtros.areaMin && areaNumero < filtros.areaMin) isVisible = false;
              if (filtros.areaMax && areaNumero > filtros.areaMax) isVisible = false;
            }
          }
        }
      }

      card.style.display = isVisible ? 'block' : 'none';

      if (isVisible) {
        visiveisCount++;
        if (isEmpreendimento) empreendimentosVisiveis++;
        else imoveisVisiveis++;
      }
    });

    atualizarContador(visiveisCount);
    atualizarBadgeFiltros();

    const nenhumEncontrado = document.querySelector('.nenhum-encontrado');
    if (nenhumEncontrado) nenhumEncontrado.style.display = visiveisCount === 0 ? 'block' : 'none';
  }

  // ================================
  // Pesquisa rápida com sugestões
  // ================================
  const filtrarDebounced = debounce(aplicarFiltrosCompletos, 300);

  if (termoInput) {
    termoInput.addEventListener('input', function () {
      btnLimpar?.classList.toggle('visivel', this.value.length > 0);

      const termo = this.value.toLowerCase().trim();

      if (termo.length >= 2) {
        const sugestoes = new Set();
        document.querySelectorAll('.card-link').forEach(card => {
          const isEmpreendimento = card.classList.contains('card-empreendimento-link');
          const campos = [
            !isEmpreendimento ? card.querySelector('.card-imagem img')?.getAttribute('alt') : null,
            card.querySelector('.card-info_principal h1')?.textContent,
            card.querySelector('.bairro')?.textContent,
            card.querySelector('.cidade')?.textContent,
          ].filter(Boolean);

          campos.forEach(item => {
            if (item.toLowerCase().includes(termo)) sugestoes.add(item.trim());
          });
        });

        if (sugestoes.size > 0 && sugestoesBox) {
          sugestoesBox.innerHTML = Array.from(sugestoes)
            .slice(0, 5)
            .map(s => `<div class="sugestao-item">${escaparHtml(s)}</div>`)
            .join('');
          sugestoesBox.style.display = 'block';
          sugestoesBox.querySelectorAll('.sugestao-item').forEach(item => {
            item.addEventListener('click', () => {
              termoInput.value = item.textContent;
              btnLimpar?.classList.add('visivel');
              sugestoesBox.style.display = 'none';
              aplicarFiltrosCompletos();
            });
          });
        } else if (sugestoesBox) {
          sugestoesBox.style.display = 'none';
        }
      } else if (sugestoesBox) {
        sugestoesBox.style.display = 'none';
      }

      filtrarDebounced();
    });
  }

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      if (termoInput) termoInput.value = '';
      if (sugestoesBox) sugestoesBox.style.display = 'none';
      btnLimpar.classList.remove('visivel');
      aplicarFiltrosCompletos();
    });
  }

  document.addEventListener('click', (e) => {
    if (
      sugestoesBox &&
      !e.target.closest('#termo-pesquisa') &&
      !e.target.closest('#sugestoes-pesquisa')
    ) {
      sugestoesBox.style.display = 'none';
    }
  });

  // ================================
  // Event listeners filtros do painel
  // ================================
  tipoSelect?.addEventListener('change', aplicarFiltrosCompletos);
  localizacaoInput?.addEventListener('input', filtrarDebounced);
  areaMinInput?.addEventListener('input', filtrarDebounced);
  areaMaxInput?.addEventListener('input', filtrarDebounced);
  quartosInput?.addEventListener('input', filtrarDebounced);
  banheirosInput?.addEventListener('input', filtrarDebounced);
  vagasInput?.addEventListener('input', filtrarDebounced);
  piscinaCheckbox?.addEventListener('change', aplicarFiltrosCompletos);
  churrasqueiraCheckbox?.addEventListener('change', aplicarFiltrosCompletos);

  // ================================
  // Sincroniza padding da barra com os cards
  // ================================
  function syncBarraComCards() {
    if (window.innerWidth < 768) return;

    const barra = document.querySelector('.barra-controles');
    const barraInfo = document.querySelector('.barra-info');
    if (!barra) return;

    const card = document.querySelector('.card-link:not([style*="display: none"])');
    if (!card) return;

    const firstRect = card.getBoundingClientRect();
    const padLeft = Math.max(firstRect.left, 16);

    const allVisible = [...document.querySelectorAll('.card-link')]
      .filter(c => c.style.display !== 'none');
    const firstRowCards = allVisible.filter(
      c => Math.abs(c.getBoundingClientRect().top - firstRect.top) < 10
    );
    const lastInRow = firstRowCards[firstRowCards.length - 1];
    const padRight = lastInRow
      ? Math.max(window.innerWidth - lastInRow.getBoundingClientRect().right, 16)
      : padLeft;

    barra.style.paddingLeft = padLeft + 'px';
    barra.style.paddingRight = padRight + 'px';

    if (barraInfo) {
      const mainPad = parseFloat(getComputedStyle(document.querySelector('.conteudo-pesquisa')).paddingLeft);
      barraInfo.style.paddingLeft = (padLeft - mainPad) + 'px';

      const ordenar = barraInfo.querySelector('.select-ordenar');
      if (ordenar) ordenar.style.marginRight = Math.max(0, padRight - mainPad) + 'px';
    }
  }

  window.addEventListener('resize', syncBarraComCards);

  // ================================
  // Fade-in nas imagens dos cards
  // ================================
  function ativarFadeInImagens() {
    document.querySelectorAll('.resultados .card-imagem img').forEach(img => {
      if (img.complete) {
        img.classList.add('carregada');
      } else {
        img.addEventListener('load', () => img.classList.add('carregada'), { once: true });
      }
    });
  }

  // ================================
  // Ordenação dos cards
  // ================================
  const selectOrdenar = document.getElementById('ordenar');
  const resultadosContainer = document.querySelector('.resultados');

  function extrairPreco(card) {
    const texto = card.querySelector('.card-preco p')?.textContent || '';
    const num = parseFloat(texto.replace(/[R$\s\.]/g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  }

  function sortarCards(ordem) {
    if (!resultadosContainer) return;
    const cards = [...resultadosContainer.querySelectorAll('.card-link')];
    if (ordem === 'padrao') {
      cards.sort((a, b) => parseInt(a.dataset.ordemOriginal || 0) - parseInt(b.dataset.ordemOriginal || 0));
    } else {
      cards.sort((a, b) => {
        const diff = extrairPreco(a) - extrairPreco(b);
        return ordem === 'menor_preco' ? diff : -diff;
      });
    }
    cards.forEach(card => resultadosContainer.appendChild(card));
  }

  selectOrdenar?.addEventListener('change', () => sortarCards(selectOrdenar.value));

  // ================================
  // Exposição global e inicialização
  // ================================
  window.filtrarImoveis = aplicarFiltrosCompletos;

  setTimeout(() => {
    if (termoInput && btnLimpar) {
      btnLimpar.classList.toggle('visivel', termoInput.value.length > 0);
    }
    // Grava ordem original dos cards para restaurar no "Padrão"
    document.querySelectorAll('.resultados .card-link').forEach((card, i) => {
      card.dataset.ordemOriginal = i;
    });
    aplicarFiltrosCompletos();
    ativarFadeInImagens();
    setTimeout(syncBarraComCards, 50);
  }, 100);
});
