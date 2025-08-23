// ================================
// dashboard.js - Bresolin Imóveis
// Sistema de Dashboard Administrativo Unificado
// ================================

// ========================================
// MÓDULO 1: NAVEGAÇÃO E CONTROLE DE VIEWS
// ========================================

/**
 * Gerencia a navegação entre as diferentes seções do dashboard
 * (Imóveis, Cadastro, Info)
 */
const NavigationModule = {
  init() {
    const menuItems = document.querySelectorAll('.menu-item');
    const views = document.querySelectorAll('.view');

    menuItems.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove classe active de todos os itens
        menuItems.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Controla visibilidade das views
        const target = btn.dataset.target;
        views.forEach(v => v.classList.toggle('active', v.id === target));

        // Carregamento lazy das seções
        this.handleViewLoad(target);
      });
    });
  },

  /**
   * Gerencia o carregamento específico de cada view
   */
  handleViewLoad(target) {
    switch(target) {
      case 'view-imoveis':
        ListingModule.listarTodos();
        HighlightsModule.montarDestaques();
        KPIModule.preencherKpis();
        break;
      case 'view-cadastro':
        // Carrega lista de empreendimentos
        EmpreendimentoModule.listarEmpreendimentos();
        ImovelModule.listarImoveisDisponiveis();
        break;
      case 'view-info':
        KPIModule.preencherKpis();
        break;
    }
  }
};

// ========================================
// MÓDULO 2: GERENCIAMENTO DE LISTAGENS
// ========================================

/**
 * Controla a exibição de imóveis e empreendimentos
 * com sistema de filtros integrado
 */
const ListingModule = {
  /**
   * Lista todos os itens (imóveis + empreendimentos) aplicando filtros
   */
  async listarTodos() {
    const lista = document.getElementById('lista-admin');
    if (!lista) return;
    
    lista.innerHTML = 'Carregando...';
    
    try {
      // Busca dados em paralelo
      const [imoveis, empreendimentos] = await Promise.all([
        fetch('/api/imoveis').then(r => r.json()),
        fetch('/api/empreendimentos').then(r => r.json())
      ]);
      
      // Aplica filtros
      const filtroTipo = document.getElementById('filtro-tipo')?.value || 'todos';
      const filtroAtivo = document.getElementById('filtro-ativo')?.checked ?? true;
      
      lista.innerHTML = '';
      
      // Adiciona imóveis se necessário
      if (filtroTipo === 'todos' || filtroTipo === 'imoveis') {
        const imoveisFiltrados = filtroAtivo ? imoveis.filter(i => !!i.ativo) : imoveis;
        imoveisFiltrados.forEach(imovel => {
          lista.appendChild(this.criarCardImovel(imovel));
        });
      }
      
      // Adiciona empreendimentos se necessário
      if (filtroTipo === 'todos' || filtroTipo === 'empreendimentos') {
        empreendimentos.forEach(empreendimento => {
          lista.appendChild(this.criarCardEmpreendimento(empreendimento));
        });
      }
    } catch (error) {
      console.error('Erro ao carregar listagem:', error);
      lista.innerHTML = '<p>Erro ao carregar dados</p>';
    }
  },

  /**
   * Cria card visual para imóvel
   */
  criarCardImovel(imovel) {
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
    
    // Event listeners
    this.setupImovelCardEvents(card, imovel, ativo);
    return card;
  },

  /**
   * Cria card visual para empreendimento
   */
  criarCardEmpreendimento(empreendimento) {
    const card = document.createElement('div');
    card.className = 'card empreendimento-admin';
    card.innerHTML = `
      <div class="thumb">
        <img src="${empreendimento.imagem && empreendimento.imagem.trim() !== "" ? empreendimento.imagem : '/static/img/casa.png'}" 
             alt="${empreendimento.nome || 'Sem nome'}">
      </div>
      <div class="title">${empreendimento.nome || 'Sem nome'} <small>(EMP ${empreendimento.id})</small></div>
      <div class="meta">Empreendimento - ${empreendimento.estagio || 'N/A'}</div>
      <div class="card-actions">
        <button class="editar">Editar</button>
        <button class="excluir">Excluir</button>
      </div>
    `;
    
    // Event listeners
    this.setupEmpreendimentoCardEvents(card, empreendimento);
    return card;
  },

  /**
   * Configura eventos do card de imóvel
   */
  setupImovelCardEvents(card, imovel, ativo) {
    // Click no card para edição
    card.onclick = (e) => {
      if (e.target.closest('.card-actions')) return;
      window.location.href = `/admin/imovel/${imovel.id}/editar`;
    };
    
    // Ativar/Desativar
    card.querySelector('.ativar, .desativar').onclick = async (e) => {
      e.stopPropagation();
      
      try {
        const response = await fetch(`/api/imoveis/${imovel.id}/toggle`, {method: 'POST'});
        if (response.ok) {
          // Atualiza apenas este card sem recarregar toda a lista
          const novoStatus = !ativo;
          const botao = e.target;
          const metaDiv = card.querySelector('.meta');
          
          // Atualiza o texto do botão
          botao.textContent = novoStatus ? 'Desativar' : 'Ativar';
          botao.className = novoStatus ? 'desativar' : 'ativar';
          
          // Atualiza o status na meta
          if (metaDiv) {
            metaDiv.textContent = novoStatus ? 'Ativo' : 'Inativo';
          }
          
          // Atualiza a variável local para próximos cliques
          ativo = novoStatus;
          
          // Atualiza apenas os destaques e KPIs (sem recarregar lista)
          HighlightsModule.montarDestaques();
          KPIModule.preencherKpis();
        }
      } catch (error) {
        console.error('Erro ao alterar status:', error);
        alert('Erro ao alterar status do imóvel');
      }
    };
    
    // Excluir
    card.querySelector('.excluir').onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
      await fetch(`/api/imoveis/${imovel.id}`, {method: 'DELETE'});
      this.listarTodos();
      HighlightsModule.montarDestaques();
      KPIModule.preencherKpis();
    };
  },

  /**
   * Configura eventos do card de empreendimento
   */
  setupEmpreendimentoCardEvents(card, empreendimento) {
    // Click no card para edição
    card.onclick = (e) => {
      if (e.target.closest('.card-actions')) return;
      window.location.href = `/admin/empreendimento/${empreendimento.id}/editar`;
    };
    
    // Editar empreendimento
    card.querySelector('.editar').onclick = (e) => {
      e.stopPropagation();
      window.location.href = `/admin/empreendimento/${empreendimento.id}/editar`;
    };
    
    // Excluir empreendimento
    card.querySelector('.excluir').onclick = async (e) => {
      e.stopPropagation();
      if (!confirm('Tem certeza que deseja excluir este empreendimento?')) return;
      await fetch(`/api/empreendimentos/${empreendimento.id}`, {method: 'DELETE'});
      this.listarTodos();
    };
  }
};

// ========================================
// MÓDULO 3: SISTEMA DE FILTROS E BUSCA
// ========================================

/**
 * Gerencia filtros de busca e seleção de tipos
 */
const FilterModule = {
  init() {
    this.setupSearchFilter();
    this.setupTypeFilters();
    this.setupUpdateButton();
  },

  /**
   * Filtro de busca em tempo real (client-side)
   */
  setupSearchFilter() {
    const searchInput = document.getElementById('busca-imoveis');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll('#lista-admin .imovel-admin, #lista-admin .empreendimento-admin');
      
      cards.forEach(card => {
        const texto = card.innerText.toLowerCase();
        card.style.display = texto.includes(termo) ? '' : 'none';
      });
    });
  },

  /**
   * Filtros de tipo e status ativo
   */
  setupTypeFilters() {
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroAtivo = document.getElementById('filtro-ativo');
    
    if (filtroTipo) {
      filtroTipo.addEventListener('change', () => ListingModule.listarTodos());
    }
    
    if (filtroAtivo) {
      filtroAtivo.addEventListener('change', () => ListingModule.listarTodos());
    }
  },

  /**
   * Botão de atualização manual
   */
  setupUpdateButton() {
    const btnAtualizar = document.getElementById('btn-atualizar');
    if (!btnAtualizar) return;

    btnAtualizar.addEventListener('click', () => {
      ListingModule.listarTodos();
      HighlightsModule.montarDestaques();
      KPIModule.preencherKpis();
    });
  }
};

// ========================================
// MÓDULO 4: SISTEMA DE DESTAQUES
// ========================================

/**
 * Gerencia imóveis em destaque no dashboard
 */
const HighlightsModule = {
  /**
   * Monta grid de destaques na página
   */
  async montarDestaques() {
    const destaquesGrid = document.getElementById('destaques-grid');
    const contDestaques = document.getElementById('cont-destaques');
    if (!destaquesGrid) return;

    // Mantém o botão "+" sempre presente
    destaquesGrid.innerHTML = `
      <div class="card add-card" id="btn-add-destaque" title="Adicionar destaque">
        <span>+</span>
      </div>
    `;
    this.adicionarEventoBotaoDestaque();

    try {
      // Busca e exibe os imóveis em destaque
      const imoveis = await fetch('/api/imoveis').then(r => r.json());
      const destaques = imoveis.filter(imovel => !!imovel.destaque && !!imovel.ativo).slice(0, 6);
      
      if (contDestaques) {
        contDestaques.textContent = `${destaques.length}/6`;
      }

      for (const imovel of destaques) {
        // Busca o mini card HTML
        const html = await fetch(`/api/card/${imovel.id}`).then(res => res.text());
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const card = temp.firstElementChild;
        // Adiciona o card antes do botão "+"
        destaquesGrid.insertBefore(card, destaquesGrid.firstChild);
      }
    } catch (error) {
      console.error('Erro ao carregar destaques:', error);
    }
  },

  /**
   * Configura evento do botão de adicionar destaque
   */
  adicionarEventoBotaoDestaque() {
    const btn = document.getElementById('btn-add-destaque');
    if (btn) {
      btn.onclick = () => this.abrirModalDestaque();
    }
  },

  /**
   * Abre modal para seleção de destaques
   */
  async abrirModalDestaque() {
    const modal = document.getElementById('modal-destaque');
    const lista = document.getElementById('lista-destaque-modal');
    if (!modal || !lista) return;
    
    lista.innerHTML = 'Carregando...';

    try {
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
    } catch (error) {
      console.error('Erro ao carregar modal de destaques:', error);
      lista.innerHTML = '<p>Erro ao carregar imóveis</p>';
    }
  },

  /**
   * Configura salvamento de destaques
   */
  setupSaveHighlights() {
    const btnSalvar = document.getElementById('btn-salvar-destaques');
    if (!btnSalvar) return;

    btnSalvar.addEventListener('click', async () => {
      const modal = document.getElementById('modal-destaque');
      const checks = modal.querySelectorAll('input[type="checkbox"]:checked');
      const ids = Array.from(checks).map(cb => parseInt(cb.value));

      if (ids.length > 6) {
        alert('Selecione no máximo 6 imóveis!');
        return;
      }

      try {
        const response = await fetch('/api/imoveis/destaque', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ids})
        });
        
        const data = await response.json();

        if (response.ok && data.sucesso) {
          alert('Destaques atualizados!');
          modal.style.display = 'none';
          this.montarDestaques();
          KPIModule.preencherKpis();
        } else {
          alert(data.erro || 'Erro ao salvar destaques');
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro de conexão com o servidor.');
      }
    });
  }
};

// ========================================
// MÓDULO 5: INDICADORES (KPIs)
// ========================================

/**
 * Gerencia os indicadores estatísticos do dashboard
 */
const KPIModule = {
  /**
   * Atualiza todos os KPIs na interface
   */
  async preencherKpis() {
    try {
      // Busca todos os imóveis
      const imoveis = await fetch('/api/imoveis').then(r => r.json());

      // Calcula estatísticas
      const total = imoveis.length;
      const ativos = imoveis.filter(imovel => !!imovel.ativo).length;
      const destaques = imoveis.filter(imovel => !!imovel.destaque && !!imovel.ativo).length;

      // Atualiza os KPIs na tela
      this.updateKPI('kpi-total', total);
      this.updateKPI('kpi-ativos', ativos);
      this.updateKPI('kpi-destaques', destaques);
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
    }
  },

  /**
   * Atualiza um KPI específico
   */
  updateKPI(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }
};

// ========================================
// MÓDULO 6: FORMULÁRIOS E ABAS
// ========================================

/**
 * Gerencia formulários de cadastro e sistema de abas
 */
const FormModule = {
  init() {
    this.setupTabs();
    this.setupClearButton();
    this.setupEmpreendimentoForm();
    this.setupImovelForm();
    this.setupEstagioControl();
  },

  /**
   * Gerenciamento das abas de cadastro
   */
  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active de todos os botões e conteúdos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Adiciona active ao botão clicado e seu conteúdo
        button.classList.add('active');
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  },

  /**
   * Controle do campo de entrega baseado no estágio
   */
  setupEstagioControl() {
    const estagioSelect = document.getElementById('estagio-imovel-select');
    const entregaInput = document.getElementById('entrega-imovel-input');
    
    if (estagioSelect && entregaInput) {
      estagioSelect.addEventListener('change', function() {
        entregaInput.disabled = this.value !== 'EM CONSTRUÇÃO';
      });
    }
  },

  /**
   * Botão para limpar formulários
   */
  setupClearButton() {
    const btnLimpar = document.getElementById('btn-limpar-form');
    if (!btnLimpar) return;

    btnLimpar.addEventListener('click', () => {
      // Detecta qual aba está ativa
      const abaImoveis = document.getElementById('tab-imoveis');
      const abaEmpreendimentos = document.getElementById('tab-empreendimentos');
      
      if (abaImoveis && abaImoveis.classList.contains('active')) {
        this.limparFormularioImoveis();
      } else if (abaEmpreendimentos && abaEmpreendimentos.classList.contains('active')) {
        this.limparFormularioEmpreendimentos();
      }
    });
  },

  /**
   * Limpa formulário de imóveis
   */
  limparFormularioImoveis() {
    const form = document.getElementById('form-imovel');
    if (form) form.reset();
    
    // Limpa galerias
    const listaSecundarias = document.getElementById('lista-secundarias');
    const listaPlantas = document.getElementById('lista-plantas');
    if (listaSecundarias) listaSecundarias.innerHTML = '';
    if (listaPlantas) listaPlantas.innerHTML = '';
    
    // Limpa preview
    const preview = document.getElementById('preview-imagem');
    if (preview) preview.src = '';
    
    // Limpa campos de preço editáveis
    this.limparCampoEditavel('preco-editavel-admin');
    this.limparCampoEditavel('iptu-editavel-admin');
    this.limparCampoEditavel('condominio-editavel-admin');
    
    // Limpa arrays temporários
    if (typeof imagensSecundariasTemp !== 'undefined') {
      imagensSecundariasTemp.length = 0;
    }
    if (typeof plantasTemp !== 'undefined') {
      plantasTemp.length = 0;
    }
  },

  /**
   * Limpa formulário de empreendimentos
   */
  limparFormularioEmpreendimentos() {
    const form = document.getElementById('form-empreendimento');
    if (form) form.reset();
    
    // Limpa preview
    const previewEmp = document.getElementById('preview-imagem-emp');
    if (previewEmp) previewEmp.src = '';
    
    // Limpa campos de preço editáveis
    this.limparCampoEditavel('preco-min-editavel');
    this.limparCampoEditavel('preco-max-editavel');
    
    // Limpa listas de imóveis
    const selecionados = document.getElementById('imoveis-selecionados');
    if (selecionados) selecionados.innerHTML = '';
    
    // Recarrega imóveis disponíveis
    ImovelModule.listarImoveisDisponiveis();
  },

  /**
   * Limpa campo editável específico
   */
  limparCampoEditavel(elementId) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      elemento.textContent = '';
    }
  },

  /**
   * Configura formulário de empreendimentos
   */
  setupEmpreendimentoForm() {
    const form = document.getElementById('form-empreendimento');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Converte FormData para objeto (igual aos imóveis)
      const data = Object.fromEntries(new FormData(form));
      
      try {
        // Enviar empreendimento principal
        const response = await fetch('/api/empreendimentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Erro ao cadastrar empreendimento');
        
        // Obter o último empreendimento cadastrado
        const lista = await fetch('/api/empreendimentos').then(r => r.json());
        const novoEmpreendimento = lista.sort((a, b) => b.id - a.id)[0];
        
        // Enviar imagens secundárias (se houver)
        if (ImageUploadModule.imagensSecundariasEmpTemp.length > 0) {
          await Promise.all(ImageUploadModule.imagensSecundariasEmpTemp.map(url =>
            fetch(`/api/empreendimentos/${novoEmpreendimento.id}/imagens`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, tipo: 'secundaria' })
            })
          ));
        }
        
        alert('Empreendimento cadastrado com sucesso!');
        form.reset();
        ImageUploadModule.imagensSecundariasEmpTemp.length = 0;
        document.getElementById('lista-secundarias-emp').innerHTML = '';
        // Atualiza listagens
        ListingModule.listarTodos();
        EmpreendimentoModule.listarEmpreendimentos();
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cadastrar empreendimento');
      }
    });
  },

  /**
   * Configura formulário de imóveis
   */
  setupImovelForm() {
    const formImovel = document.getElementById('form-imovel');
    if (!formImovel) return;

    formImovel.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = Object.fromEntries(new FormData(formImovel));

      // Validação mínima
      if (!data.tipo) {
        alert("O tipo do imóvel é obrigatório.");
        return;
      }

      // Conversões e tratamentos
      data.ativo = formImovel.ativo.checked;
      data.empreendimento_id = data.empreendimento_id || null;
      data.preco = parseFloat(data.preco) || 0;
      data.area = parseFloat(data.area) || 0;
      data.quartos = parseInt(data.quartos) || 0;
      data.vagas = parseInt(data.vagas) || 0;
      data.andar = parseInt(data.andar) || 0;
      data.suites = parseInt(data.suites) || 0;
      data.banheiros = parseInt(data.banheiros) || 0;
      data.banheiros_com_chuveiro = parseInt(data.banheiros_com_chuveiro) || 0;
      data.iptu = parseFloat(data.iptu) || 0;

      data.piscina = formImovel.piscina?.checked || false;
      data.churrasqueira = formImovel.churrasqueira?.checked || false;

      // Forçar campos que podem estar desabilitados ou ausentes
      data.entrega = document.getElementById('entrega-imovel-input').value || null;
      data.imagem = data.imagem?.trim() || "";

      // Campos opcionais de texto
      data.estagio = data.estagio || null;
      data.campo_extra1 = data.campo_extra1 || null;
      data.campo_extra2 = data.campo_extra2 || null;
      data.link = data.link || null;

      try {
        // Enviar imóvel principal
        const res = await fetch('/api/imoveis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Erro ao cadastrar imóvel');

        // Obter o último imóvel cadastrado
        const lista = await fetch('/api/imoveis').then(r => r.json());
        const novoImovel = lista.sort((a, b) => b.id - a.id)[0];

        // Enviar imagens secundárias
        if (typeof imagensSecundariasTemp !== 'undefined' && imagensSecundariasTemp.length > 0) {
          await Promise.all(imagensSecundariasTemp.map(url =>
            fetch(`/api/imoveis/${novoImovel.id}/imagens`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, tipo: 'secundaria' })
            })
          ));
        }

        // Enviar plantas
        if (typeof plantasTemp !== 'undefined' && plantasTemp.length > 0) {
          await Promise.all(plantasTemp.map(url =>
            fetch(`/api/imoveis/${novoImovel.id}/imagens`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, tipo: 'planta' })
            })
          ));
        }

        alert("Imóvel cadastrado com sucesso!");
        this.limparFormularioImoveis();
        
        // Atualiza listagens
        ListingModule.listarTodos();
        ImovelModule.listarImoveisDisponiveis();
        KPIModule.preencherKpis();

      } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao cadastrar o imóvel.");
      }
    });
  }
};

// ========================================
// MÓDULO 7: GERENCIAMENTO DE IMÓVEIS
// ========================================

/**
 * Módulo específico para operações com imóveis
 */
const ImovelModule = {
  /**
   * Lista imóveis disponíveis (sem empreendimento vinculado)
   */
  listarImoveisDisponiveis() {
    fetch('/api/imoveis')
      .then(response => response.json())
      .then(data => {
        console.log('Total de imóveis encontrados:', data.length);
        console.log('Dados dos imóveis:', data);
        
        const select = document.getElementById('imoveis-disponiveis');
        if (select) {
          select.innerHTML = '';
          
          let imoveisDisponiveis = 0;
          data.forEach(imovel => {
            console.log(`Imóvel ${imovel.id}: empreendimento_id = ${imovel.empreendimento_id}`);
            
            // Só adiciona imóveis que não têm empreendimento vinculado
            if (!imovel.empreendimento_id) {
              const option = document.createElement('option');
              option.value = imovel.id;
              option.textContent = `${imovel.titulo} - ${imovel.tipo} - R$ ${imovel.preco ? parseFloat(imovel.preco).toLocaleString('pt-BR') : 'N/A'}`;
              select.appendChild(option);
              imoveisDisponiveis++;
            }
          });
          
          console.log('Imóveis disponíveis (sem empreendimento):', imoveisDisponiveis);
          
          if (imoveisDisponiveis === 0) {
            const option = document.createElement('option');
            option.textContent = 'Nenhum imóvel disponível';
            option.disabled = true;
            select.appendChild(option);
          }
        }
      })
      .catch(error => {
        console.error('Erro ao carregar imóveis:', error);
      });
  },

  /**
   * Move imóveis da lista disponível para selecionados
   */
  adicionarImovel() {
    const disponiveis = document.getElementById('imoveis-disponiveis');
    const selecionados = document.getElementById('imoveis-selecionados');
    
    if (disponiveis && selecionados && disponiveis.selectedIndex >= 0) {
      const selectedOption = disponiveis.options[disponiveis.selectedIndex];
      selecionados.appendChild(selectedOption);
      
      // Atualizar estado dos botões
      this.atualizarBotoesImoveis();
    }
  },

  /**
   * Move imóveis da lista selecionados para disponível
   */
  removerImovel() {
    const disponiveis = document.getElementById('imoveis-disponiveis');
    const selecionados = document.getElementById('imoveis-selecionados');
    
    if (disponiveis && selecionados && selecionados.selectedIndex >= 0) {
      const selectedOption = selecionados.options[selecionados.selectedIndex];
      disponiveis.appendChild(selectedOption);
      
      // Atualizar estado dos botões
      this.atualizarBotoesImoveis();
    }
  },

  /**
   * Atualiza estado dos botões de adicionar/remover imóveis
   */
  atualizarBotoesImoveis() {
    const disponiveis = document.getElementById('imoveis-disponiveis');
    const selecionados = document.getElementById('imoveis-selecionados');
    const btnAdicionar = document.getElementById('btn-adicionar-imovel');
    const btnRemover = document.getElementById('btn-remover-imovel');
    
    if (btnAdicionar) {
      btnAdicionar.disabled = !disponiveis || disponiveis.selectedIndex < 0;
    }
    
    if (btnRemover) {
      btnRemover.disabled = !selecionados || selecionados.selectedIndex < 0;
    }
  },

  /**
   * Obtém IDs dos imóveis selecionados
   */
  getImoveisSelecionados() {
    const selecionados = document.getElementById('imoveis-selecionados');
    const ids = [];
    
    if (selecionados) {
      for (let i = 0; i < selecionados.options.length; i++) {
        ids.push(parseInt(selecionados.options[i].value));
      }
    }
    
    return ids;
  },

  /**
   * Configura event listeners para seleção de imóveis
   */
  setupEventListeners() {
    const btnAdicionar = document.getElementById('btn-adicionar-imovel');
    const btnRemover = document.getElementById('btn-remover-imovel');
    const disponiveis = document.getElementById('imoveis-disponiveis');
    const selecionados = document.getElementById('imoveis-selecionados');
    
    if (btnAdicionar) {
      btnAdicionar.addEventListener('click', () => this.adicionarImovel());
    }
    
    if (btnRemover) {
      btnRemover.addEventListener('click', () => this.removerImovel());
    }
    
    // Event listeners para atualizar botões quando seleção muda
    if (disponiveis) {
      disponiveis.addEventListener('change', () => this.atualizarBotoesImoveis());
    }
    
    if (selecionados) {
      selecionados.addEventListener('change', () => this.atualizarBotoesImoveis());
    }
    
    // Inicializar estado dos botões
    this.atualizarBotoesImoveis();
  }
};

// ========================================
// MÓDULO 8: GERENCIAMENTO DE EMPREENDIMENTOS
// ========================================

/**
 * Módulo específico para operações com empreendimentos
 */
const EmpreendimentoModule = {
  /**
   * Lista empreendimentos para seleção em formulários
   */
  listarEmpreendimentos() {
    fetch('/api/empreendimentos')
      .then(r => r.json())
      .then(empreendimentos => {
        const select = document.getElementById('empreendimento-select');
        if (select) {
          select.innerHTML = '<option value="">Sem empreendimento</option>';
          empreendimentos.forEach(emp => {
            const opt = document.createElement('option');
            opt.value = emp.id;
            opt.textContent = `${emp.nome} (ID ${emp.id})`;
            select.appendChild(opt);
          });
        }
      })
      .catch(error => {
        console.error('Erro ao carregar empreendimentos:', error);
      });
  }
};

// ========================================
// MÓDULO 9: UPLOAD DE IMAGENS (CLOUDINARY)
// ========================================

/**
 * Gerencia uploads de imagens para Cloudinary
 */
const ImageUploadModule = {
  // Arrays temporários para armazenar URLs das imagens
  imagensSecundariasTemp: [],
  plantasTemp: [],
  imagensSecundariasEmpTemp: [], // Novo array para empreendimentos
  cloudName: 'dexpbb2dd',
  uploadPreset: 'bresolin',

  init() {
    this.setupMainImageUpload();
    this.setupSecondaryImagesUpload();
    this.setupPlantsUpload();
    this.setupEmpreendimentoImageUpload();
    this.setupEmpreendimentoSecondaryImagesUpload(); // Nova função
    this.setupEmpreendimentoSecondaryImagesEdit(); // Nova função para edição
  },

  /**
   * Upload de imagem principal do imóvel
   */
  setupMainImageUpload() {
    const fileInput = document.getElementById('file-imagem');
    const preview = document.getElementById('preview-imagem');
    const hiddenInput = document.getElementById('input-imagem');
    
    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];

      if (!file) {
        if (preview) preview.style.display = 'none';
        return;
      }

      // Preview local
      if (preview) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }

      // Upload para Cloudinary
      try {
        const url = await this.uploadToCloudinary(file);
        if (hiddenInput) {
          hiddenInput.value = url;
        }
      } catch (error) {
        console.error('Erro no upload da imagem principal:', error);
        alert('Erro ao fazer upload da imagem');
      }
    });
  },

  /**
   * Upload de imagens secundárias
   */
  setupSecondaryImagesUpload() {
    const fileInput = document.getElementById('file-secundarias');
    const galeria = document.getElementById('lista-secundarias');
    
    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (galeria) galeria.innerHTML = '';
      this.imagensSecundariasTemp.length = 0;

      const limitePreview = 4;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        try {
          const url = await this.uploadToCloudinary(file);
          this.imagensSecundariasTemp.push(url);

          if (galeria && i < limitePreview) {
            const img = document.createElement('img');
            img.src = url;
            galeria.appendChild(img);
          }

          if (galeria && i === limitePreview - 1 && files.length > limitePreview) {
            const restante = files.length - limitePreview;
            const span = document.createElement('div');
            span.className = 'preview-contador';
            span.textContent = `+ ${restante} foto${restante > 1 ? 's' : ''}`;
            galeria.appendChild(span);
          }
        } catch (error) {
          console.error('Erro no upload da imagem secundária:', error);
        }
      }
    });
  },

  /**
   * Upload de plantas
   */
  setupPlantsUpload() {
    const fileInput = document.getElementById('file-plantas');
    const galeria = document.getElementById('lista-plantas');
    
    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (galeria) galeria.innerHTML = '';
      this.plantasTemp.length = 0;

      const limitePreview = 4;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        try {
          const url = await this.uploadToCloudinary(file);
          this.plantasTemp.push(url);

          if (galeria && i < limitePreview) {
            const img = document.createElement('img');
            img.src = url;
            galeria.appendChild(img);
          }

          if (galeria && i === limitePreview - 1 && files.length > limitePreview) {
            const restante = files.length - limitePreview;
            const span = document.createElement('div');
            span.className = 'preview-contador';
            span.textContent = `+ ${restante} planta${restante > 1 ? 's' : ''}`;
            galeria.appendChild(span);
          }
        } catch (error) {
          console.error('Erro no upload da planta:', error);
        }
      }
    });
  },

  /**
   * Upload de imagem do empreendimento
   */
  setupEmpreendimentoImageUpload() {
    const fileInput = document.getElementById('file-imagem-emp');
    const preview = document.getElementById('preview-imagem-emp');
    const hiddenInput = document.getElementById('input-imagem-emp');
    
    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];

      if (!file) {
        if (preview) preview.style.display = 'none';
        return;
      }

      // Preview local
      if (preview) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }

      // Upload para Cloudinary
      try {
        const url = await this.uploadToCloudinary(file);
        if (hiddenInput) {
          hiddenInput.value = url;
        }
      } catch (error) {
        console.error('Erro no upload da imagem do empreendimento:', error);
        alert('Erro ao fazer upload da imagem');
      }
    });
  },

  /**
   * Função auxiliar para upload no Cloudinary
   */
  async uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erro no upload para Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  },

  /**
   * Upload de imagens secundárias do empreendimento (cadastro)
   */
  setupEmpreendimentoSecondaryImagesUpload() {
    const fileInput = document.getElementById('file-secundarias-emp');
    const galeria = document.getElementById('lista-secundarias-emp');
    
    if (!fileInput) return;

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (galeria) galeria.innerHTML = '';
      this.imagensSecundariasEmpTemp.length = 0;

      const limitePreview = 4;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        try {
          const url = await this.uploadToCloudinary(file);
          this.imagensSecundariasEmpTemp.push(url);

          if (galeria && i < limitePreview) {
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = 'width: 80px; height: 60px; object-fit: cover; margin: 5px; border-radius: 4px;';
            galeria.appendChild(img);
          }

          if (galeria && i === limitePreview - 1 && files.length > limitePreview) {
            const restante = files.length - limitePreview;
            const span = document.createElement('div');
            span.className = 'preview-contador';
            span.textContent = `+ ${restante} foto${restante > 1 ? 's' : ''}`;
            galeria.appendChild(span);
          }
        } catch (error) {
          console.error('Erro no upload da imagem secundária do empreendimento:', error);
        }
      }
    });
  },

  /**
   * Gerenciamento de imagens secundárias na edição de empreendimento
   */
  setupEmpreendimentoSecondaryImagesEdit() {
    const fileInput = document.getElementById('file-secundarias-emp-edit');
    const galeria = document.getElementById('lista-secundarias-emp-edit');
    
    if (!fileInput) return;

    // Carrega imagens existentes
    this.loadExistingEmpreendimentoImages();

    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      
      for (const file of files) {
        try {
          const url = await this.uploadToCloudinary(file);
          await this.addImageToEmpreendimento(url);
          this.loadExistingEmpreendimentoImages(); // Recarrega a galeria
        } catch (error) {
          console.error('Erro no upload da imagem:', error);
          alert('Erro ao fazer upload da imagem');
        }
      }
      
      // Limpa o input
      fileInput.value = '';
    });
  },

  /**
   * Carrega imagens existentes do empreendimento na edição
   */
  async loadExistingEmpreendimentoImages() {
    const galeria = document.getElementById('lista-secundarias-emp-edit');
    if (!galeria) return;

    // Pega o ID do empreendimento da URL ou de um campo hidden
    const empreendimentoId = this.getEmpreendimentoIdFromEdit();
    if (!empreendimentoId) return;

    try {
      const response = await fetch(`/api/empreendimentos/${empreendimentoId}/imagens`);
      const imagens = await response.json();
      
      galeria.innerHTML = '';
      
      imagens.forEach(imagem => {
        const container = document.createElement('div');
        container.style.cssText = 'position: relative; display: inline-block; margin: 5px;';
        
        const img = document.createElement('img');
        img.src = imagem.url;
        img.style.cssText = 'width: 100px; height: 75px; object-fit: cover; border-radius: 4px;';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.cssText = 'position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;';
        deleteBtn.onclick = () => this.deleteEmpreendimentoImage(imagem.id, container);
        
        container.appendChild(img);
        container.appendChild(deleteBtn);
        galeria.appendChild(container);
      });
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    }
  },

  /**
   * Adiciona uma nova imagem ao empreendimento
   */
  async addImageToEmpreendimento(url) {
    const empreendimentoId = this.getEmpreendimentoIdFromEdit();
    if (!empreendimentoId) return;

    const response = await fetch(`/api/empreendimentos/${empreendimentoId}/imagens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: url })
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar imagem no banco de dados');
    }
  },

  /**
   * Remove uma imagem do empreendimento
   */
  async deleteEmpreendimentoImage(imagemId, container) {
    if (!confirm('Deseja realmente excluir esta imagem?')) return;

    try {
      const response = await fetch(`/api/imagens_empreendimento/${imagemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        container.remove();
      } else {
        alert('Erro ao excluir imagem');
      }
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      alert('Erro ao excluir imagem');
    }
  },

  /**
   * Obtém o ID do empreendimento na página de edição
   */
  getEmpreendimentoIdFromEdit() {
    // Tenta pegar da URL
    const urlParts = window.location.pathname.split('/');
    const editIndex = urlParts.indexOf('editar_empreendimento');
    if (editIndex !== -1 && urlParts[editIndex + 1]) {
      return urlParts[editIndex + 1];
    }
    
    // Tenta pegar de um campo hidden
    const hiddenField = document.getElementById('empreendimento-id');
    if (hiddenField) {
      return hiddenField.value;
    }
    
    return null;
  }
};

// ========================================
// MÓDULO 10: CAMPOS MONETÁRIOS
// ========================================

/**
 * Gerencia formatação de campos monetários
 */
const MoneyFieldModule = {
  init() {
    this.configurarCampoMonetario('preco-editavel-admin', 'preco-admin-real');
    this.configurarCampoMonetario('iptu-editavel-admin', 'iptu-admin-real');
    this.configurarCampoMonetario('condominio-editavel-admin', 'condominio-admin-real');
    this.configurarCampoMonetario('preco-min-editavel', 'preco-min-real');
    this.configurarCampoMonetario('preco-max-editavel', 'preco-max-real');
  },

  /**
   * Configura campo monetário com formatação automática
   */
  configurarCampoMonetario(idEditavel, idReal) {
    const editavel = document.getElementById(idEditavel);
    const real = document.getElementById(idReal);
    
    if (!editavel) return;

    editavel.addEventListener('input', (e) => {
      // Remove caracteres não numéricos e ",00"
      let texto = e.target.innerText.replace(',00', '').replace(/\D/g, '');

      if (texto) {
        const formatado = parseInt(texto).toLocaleString('pt-BR') + ',00';
        e.target.innerText = formatado;
        if (real) real.value = texto;

        // Reposiciona o cursor corretamente
        this.reposicionarCursorAntesDaVirgula(e.target);
      } else {
        e.target.innerText = '';
        if (real) real.value = '';
      }
    });

    // Impede quebra de linha com Enter
    editavel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault();
    });
  },

  /**
   * Reposiciona cursor antes da vírgula
   */
  reposicionarCursorAntesDaVirgula(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    const node = el.firstChild;
    if (!node) return;

    // Localiza a vírgula ou, se não existir, vai para o final
    const index = node.textContent.indexOf(',') > -1 ? node.textContent.indexOf(',') : node.textContent.length;

    range.setStart(node, index);
    range.setEnd(node, index);
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

// ========================================
// MÓDULO 11: INICIALIZAÇÃO DO SISTEMA
// ========================================

/**
 * Controla a inicialização de todos os módulos
 */
const AppModule = {
  /**
   * Inicializa toda a aplicação
   */
  init() {
    // Aguarda o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.startApp());
    } else {
      this.startApp();
    }
  },

  /**
   * Inicia todos os módulos da aplicação
   */
  startApp() {
    try {
      // Inicializa módulos principais
      NavigationModule.init();
      FilterModule.init();
      FormModule.init();
      ImageUploadModule.init();
      MoneyFieldModule.init();
      ImovelModule.setupEventListeners();
      
      // Configura sistema de destaques
      HighlightsModule.setupSaveHighlights();
      
      // Carregamento inicial dos dados
      this.initialLoad();
      
      // Expõe arrays temporários globalmente para compatibilidade
      window.imagensSecundariasTemp = ImageUploadModule.imagensSecundariasTemp;
      window.plantasTemp = ImageUploadModule.plantasTemp;
      
      console.log('Dashboard inicializado com sucesso');
    } catch (error) {
      console.error('Erro na inicialização do dashboard:', error);
    }
  },

  /**
   * Carregamento inicial de dados
   */
  async initialLoad() {
    try {
      await Promise.all([
        ListingModule.listarTodos(),
        HighlightsModule.montarDestaques(),
        KPIModule.preencherKpis()
      ]);
      
      // Carrega listas específicas
      EmpreendimentoModule.listarEmpreendimentos();
      ImovelModule.listarImoveisDisponiveis();
    } catch (error) {
      console.error('Erro no carregamento inicial:', error);
    }
  }
};

// ========================================
// FUNÇÕES GLOBAIS PARA COMPATIBILIDADE
// ========================================

// Mantém funções globais para compatibilidade com código existente
function listarImoveis() {
  ListingModule.listarTodos();
}

function listarEmpreendimentos() {
  EmpreendimentoModule.listarEmpreendimentos();
}

function listarImoveisDisponiveis() {
  ImovelModule.listarImoveisDisponiveis();
}

function alternarAtivo(id) {
  fetch(`/api/imoveis/${id}/toggle`, { method: 'POST' })
    .then(() => {
      ListingModule.listarTodos();
      KPIModule.preencherKpis();
    });
}

function removerImovel(id) {
  if (!confirm("Tem certeza que deseja excluir este imóvel?")) return;
  fetch(`/api/imoveis/${id}`, { method: 'DELETE' })
    .then(() => {
      ListingModule.listarTodos();
      KPIModule.preencherKpis();
    });
}

function editarImovel(id) {
  window.location.href = `/admin/imovel/${id}/editar`;
}

function adicionarImovel() {
  ImovelModule.adicionarImovel();
}

function removerImovelSelecionado() {
  ImovelModule.removerImovel();
}

function atualizarBotoesImoveis() {
  ImovelModule.atualizarBotoesImoveis();
}

function getImoveisSelecionados() {
  return ImovelModule.getImoveisSelecionados();
}

function cadastrarEmpreendimento(event) {
  // Esta função será chamada pelo form submit que já está configurado no FormModule
  console.log('Função cadastrarEmpreendimento chamada - usando FormModule');
}

// ========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ========================================

// Inicia a aplicação
AppModule.init();

// Exporta módulos para uso externo se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NavigationModule,
    ListingModule,
    FilterModule,
    HighlightsModule,
    KPIModule,
    FormModule,
    ImovelModule,
    EmpreendimentoModule,
    ImageUploadModule,
    MoneyFieldModule,
    AppModule
  };
}