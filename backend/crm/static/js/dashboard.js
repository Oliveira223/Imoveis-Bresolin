
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização
    KanbanModule.init();
    NovosLeadsModule.init(); // Inicia o módulo de novos leads
    SidebarModule.init();
});

// ========================
// MÓDULO SIDEBAR & UI
// ========================
const SidebarModule = {
    init() {
        this.setupMenuLateral();
        this.setupAgenda();
        this.setupNavigation();
    },

    setupMenuLateral() {
        const btnMenu = document.getElementById('btn-menu-lateral');
        const sidebar = document.getElementById('sidebar-lateral');
        const btnClose = document.getElementById('close-sidebar');
        const overlay = document.getElementById('overlay');

        const toggleSidebar = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        };

        if(btnMenu) btnMenu.onclick = toggleSidebar;
        if(btnClose) btnClose.onclick = toggleSidebar;
        if(overlay) overlay.onclick = () => {
            sidebar.classList.remove('open');
            document.getElementById('sidebar-agenda').classList.remove('open');
            overlay.classList.remove('active');
        };
    },

    setupAgenda() {
        const btnAgenda = document.getElementById('btn-agenda');
        const sidebarAgenda = document.getElementById('sidebar-agenda');
        const btnClose = document.getElementById('close-agenda');
        const overlay = document.getElementById('overlay');

        const toggleAgenda = () => {
            sidebarAgenda.classList.toggle('open');
            overlay.classList.toggle('active');
        };

        if(btnAgenda) btnAgenda.onclick = toggleAgenda;
        if(btnClose) btnClose.onclick = toggleAgenda;
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        // Listener para os itens da topbar
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.navigateTo(item.dataset.view);
            });
        });
    },

    navigateTo(viewName) {
        // Remove active de todos nav-items
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.remove('active');
            if(n.dataset.view === viewName) n.classList.add('active');
        });

        // Esconde todas as views
        document.querySelectorAll('.view-section').forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none';
        });

        // Mostra a view alvo
        const targetView = document.getElementById(`view-${viewName}`);
        if(targetView) {
            targetView.classList.add('active');
            // Se for home, display flex centralizado, senão flex normal
            targetView.style.display = 'flex';
        }
    }
};

// ========================
// MÓDULO KANBAN
// ========================
const KanbanModule = {
    init() {
        this.carregarLeads();
        this.setupDragAndDrop();
    },

    setupDragAndDrop() {
        const columns = document.querySelectorAll('.kanban-column');
        
        columns.forEach(column => {
            column.addEventListener('dragover', e => {
                e.preventDefault();
                column.classList.add('drag-over');
            });
            
            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });
            
            column.addEventListener('drop', e => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const cardId = e.dataTransfer.getData('text/plain');
                const card = document.querySelector(`[data-id="${cardId}"]`);
                
                if (card) {
                    const newStatus = column.dataset.status;
                    this.atualizarStatus(cardId, newStatus);
                    column.querySelector('.column-body').appendChild(card);
                    this.recalcularContadores();
                }
            });
        });
    },

    async atualizarStatus(id, status) {
        try {
            await fetch('/corretores/api/leads/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao mover card. Recarregue a página.');
        }
    },

    recalcularContadores() {
        document.querySelectorAll('.kanban-column').forEach(col => {
            const count = col.querySelectorAll('.kanban-card').length;
            col.querySelector('.count').textContent = count;
        });
    },

    async carregarLeads() {
        try {
            const response = await fetch('/corretores/api/leads?filtro=meus');
            const leads = await response.json();
            this.renderizarLeads(leads);
        } catch (error) {
            console.error("Erro ao carregar leads:", error);
        }
    },

    renderizarLeads(leads) {
        // Limpar colunas
        document.querySelectorAll('.column-body').forEach(col => col.innerHTML = '');
        
        // Contadores
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        leads.forEach(lead => {
            const card = this.criarCard(lead);
            const coluna = document.querySelector(`.kanban-column[data-status="${lead.status}"] .column-body`);
            
            if (coluna) {
                coluna.appendChild(card);
                counts[lead.status]++;
            }
        });

        // Atualizar contadores na UI
        Object.keys(counts).forEach(status => {
            const badge = document.querySelector(`.kanban-column[data-status="${status}"] .count`);
            if (badge) badge.textContent = counts[status];
        });
    },

    criarCard(lead) {
        const div = document.createElement('div');
        div.className = 'kanban-card';
        div.draggable = true;
        div.dataset.id = lead.id; // Importante para o Drag & Drop

        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', lead.id);
            div.classList.add('dragging');
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
        });
        
        const tagClass = lead.objetivo === 'Investimento' ? 'tag-investimento' : 'tag-moradia';
        const imovelTitulo = lead.imovel_titulo || 'Interesse Geral';
        const whatsappLink = `https://wa.me/${lead.telefone.replace(/\D/g, '')}`;

        div.innerHTML = `
            <div class="card-title">${lead.nome}</div>
            <div class="card-info">
                <i class="fas fa-home"></i> ${imovelTitulo}<br>
                <a href="${whatsappLink}" target="_blank" style="color: #aaa; text-decoration: none;">
                    <i class="fab fa-whatsapp"></i> ${lead.telefone}
                </a>
            </div>
            <div class="card-footer">
                <span class="tag ${tagClass}">${lead.objetivo || 'Não informado'}</span>
                <span>${lead.data_formatada}</span>
            </div>
        `;
        
        return div;
    }
};

// ========================
// MÓDULO NOVOS LEADS (TABELA + DRAWER)
// ========================
const NovosLeadsModule = {
    leads: [], // Cache local dos leads

    init() {
        this.tbody = document.getElementById('lista-novos-leads-body');
        this.panel = document.getElementById('lead-details-panel');
        this.panelContent = document.getElementById('lead-details-content');
        this.overlay = document.getElementById('overlay');

        // Carregar leads ao iniciar e a cada 30 segundos
        this.carregarNovosLeads();
        setInterval(() => this.carregarNovosLeads(), 30000);

        // Fechar painel ao clicar no overlay (se desejar) ou apenas botão fechar
        // Mas o overlay é usado pelo menu lateral. Vamos usar um listener específico se painel estiver aberto.
    },

    async carregarNovosLeads() {
        if (!this.tbody) return;

        try {
            const response = await fetch('/corretores/api/leads?filtro=novos');
            this.leads = await response.json();
            this.filtrarLeads(); // Renderiza já aplicando filtro se houver texto
        } catch (error) {
            console.error("Erro ao carregar novos leads:", error);
            this.tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Erro ao carregar leads.</td></tr>';
        }
    },

    filtrarLeads() {
        const termo = document.getElementById('search-novos-leads').value.toLowerCase();
        
        const filtrados = this.leads.filter(lead => {
            return (lead.nome && lead.nome.toLowerCase().includes(termo)) ||
                   (lead.telefone && lead.telefone.includes(termo));
        });

        this.renderizarLista(filtrados);
    },

    renderizarLista(leads) {
        if (leads.length === 0) {
            this.tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #888;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        Nenhum novo lead encontrado.
                    </td>
                </tr>`;
            return;
        }

        this.tbody.innerHTML = '';
        
        leads.forEach(lead => {
            const tr = document.createElement('tr');
            tr.onclick = (e) => {
                // Não abre se clicar nos botões de ação
                if (e.target.closest('button') || e.target.closest('a')) return;
                this.abrirDetalhes(lead.id);
            };

            const telefoneFormatado = lead.telefone || '';
            const whatsappLink = `https://wa.me/${telefoneFormatado.replace(/\D/g, '')}`;
            const imovelTitulo = lead.imovel_titulo || 'Interesse Geral';
            const objetivo = lead.objetivo || '-';

            tr.innerHTML = `
                <td>
                    <div class="col-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                </td>
                <td class="lead-name-cell">${lead.nome}</td>
                <td>
                    <div class="lead-contact-cell">
                        <span>${telefoneFormatado}</span>
                        <a href="${whatsappLink}" target="_blank" title="Chamar no WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </div>
                </td>
                <td>
                    <div class="lead-interest-cell">
                        <span class="interest-title">${imovelTitulo}</span>
                        <span class="interest-tag">${objetivo}</span>
                    </div>
                </td>
                <td style="color: #888; font-size: 0.9rem;">${lead.data_formatada}</td>
                <td>
                    <div class="action-btn-group">
                        <button class="btn-icon" title="Ver Detalhes" onclick="NovosLeadsModule.abrirDetalhes(${lead.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon delete" title="Arquivar" onclick="NovosLeadsModule.moverLead(${lead.id}, 'Arquivado', event)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            this.tbody.appendChild(tr);
        });
    },

    abrirDetalhes(id) {
        const lead = this.leads.find(l => l.id === id);
        if (!lead) return;

        const telefoneFormatado = lead.telefone || '';
        const whatsappLink = `https://wa.me/${telefoneFormatado.replace(/\D/g, '')}`;
        const imovelTitulo = lead.imovel_titulo || 'Interesse Geral';

        this.panelContent.innerHTML = `
            <div class="panel-section">
                <span class="panel-label">Nome do Cliente</span>
                <div class="panel-value">${lead.nome}</div>
            </div>

            <div class="panel-section">
                <span class="panel-label">Contato</span>
                <div class="panel-value" style="display: flex; justify-content: space-between; align-items: center;">
                    ${telefoneFormatado}
                    <a href="${whatsappLink}" target="_blank" class="whatsapp-btn-small">
                        <i class="fab fa-whatsapp"></i> Conversar
                    </a>
                </div>
            </div>

            <div class="panel-section">
                <span class="panel-label">Interesse</span>
                <div class="panel-value">${imovelTitulo}</div>
            </div>
            
            <div class="panel-section">
                <span class="panel-label">Objetivo</span>
                <div class="panel-value">${lead.objetivo || 'Não informado'}</div>
            </div>

            <div class="panel-section">
                <span class="panel-label">Observações / Comentários</span>
                <div id="panel-comentarios-area">
                    <div class="loading-small">Carregando comentários...</div>
                </div>
            </div>

            <div class="panel-actions">
                <button class="btn-associar" onclick="NovosLeadsModule.associarCorretor(${lead.id}, event)">
                    <i class="fas fa-user-plus"></i> Atender Este Cliente
                </button>
                <button class="btn-small" style="width: 100%; border-color: #ff6b6b; color: #ff6b6b;" onclick="NovosLeadsModule.moverLead(${lead.id}, 'Ignorado', event)">
                    <i class="fas fa-eye-slash"></i> Ignorar Lead
                </button>
            </div>
        `;

        this.panel.classList.add('active');
        this.overlay.classList.add('active');
        
        // Listener para fechar overlay
        this.overlay.onclick = () => this.fecharDetalhes();

        // Carregar comentários
        this.carregarComentariosPainel(id);
    },

    fecharDetalhes() {
        this.panel.classList.remove('active');
        // Só remove o overlay se o menu lateral não estiver aberto
        if (!document.getElementById('sidebar-lateral').classList.contains('open')) {
            this.overlay.classList.remove('active');
        }
        // Restaura o onclick original do overlay (Menu Lateral)
        this.overlay.onclick = () => {
             document.getElementById('sidebar-lateral').classList.remove('open');
             document.getElementById('sidebar-agenda').classList.remove('open');
             this.overlay.classList.remove('active');
        };
    },

    async carregarComentariosPainel(id) {
        const area = document.getElementById('panel-comentarios-area');
        try {
            const response = await fetch(`/corretores/api/leads/${id}/comentarios`);
            const comentarios = await response.json();
            
            let html = `
                <div class="comentarios-lista" style="max-height: 150px; overflow-y: auto; margin-bottom: 10px;">
            `;

            if (comentarios.length === 0) {
                html += '<div class="empty-comment">Nenhum comentário.</div>';
            } else {
                html += comentarios.map(c => `
                    <div class="comentario-item">
                        <div class="comentario-meta">
                            <span class="comentario-autor">${c.corretor_nome || 'Sistema'}</span>
                            <span class="comentario-data">${c.data_formatada}</span>
                        </div>
                        <div class="comentario-texto">${c.texto}</div>
                    </div>
                `).join('');
            }
            html += '</div>';
            
            // Adicionar novo comentário
            html += `
                <div class="novo-comentario-simple">
                    <textarea id="texto-novo-comentario-${id}" placeholder="Adicionar nota..." style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px; min-height: 60px; margin-bottom: 5px;"></textarea>
                    <button class="btn-small" onclick="NovosLeadsModule.salvarComentarioPainel(${id})">Salvar Nota</button>
                </div>
            `;

            area.innerHTML = html;

        } catch (error) {
            area.innerHTML = '<div class="error-msg">Erro ao carregar comentários.</div>';
        }
    },

    async salvarComentarioPainel(id) {
        const textoInput = document.getElementById(`texto-novo-comentario-${id}`);
        const texto = textoInput.value.trim();
        
        if (!texto) return;

        try {
            const response = await fetch(`/corretores/api/leads/${id}/comentarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto })
            });

            if (response.ok) {
                this.carregarComentariosPainel(id); // Recarrega área
            } else {
                alert('Erro ao salvar comentário');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        }
    },

    async moverLead(id, novoStatus, event) {
        if (event) event.stopPropagation();
        
        if (!confirm(`Tem certeza que deseja mover para "${novoStatus}"?`)) return;

        try {
            const response = await fetch('/corretores/api/leads/info', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status_geral: novoStatus })
            });
            
            if (response.ok) {
                this.fecharDetalhes();
                // Remove do cache e re-renderiza
                this.leads = this.leads.filter(l => l.id !== id);
                this.filtrarLeads();
            } else {
                alert('Erro ao mover lead.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        }
    },

    async associarCorretor(leadId, event) {
        if (event) event.stopPropagation();
        
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        btn.disabled = true;

        try {
            const response = await fetch('/corretores/api/leads/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: leadId, 
                    status: 1 // LEAD
                })
            });

            const result = await response.json();

            if (result.sucesso) {
                this.fecharDetalhes();
                // Remove do cache e re-renderiza
                this.leads = this.leads.filter(l => l.id !== leadId);
                this.filtrarLeads();
                
                // Atualiza o Kanban
                KanbanModule.carregarLeads();
            } else {
                throw new Error(result.erro || 'Erro ao associar');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao associar lead: ' + error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};
