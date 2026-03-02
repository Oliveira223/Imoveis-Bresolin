// ========================
// MÓDULO LISTAS
// ========================
const ListasModule = {
    leads: [],
    currentFilter: 'todos',

    init() {
        this.carregarLista();
    },

    mudarAba(filtro) {
        this.currentFilter = filtro;
        
        // Atualiza UI das abas
        const botoes = document.querySelectorAll('.tab-btn');
        botoes.forEach(btn => btn.classList.remove('active'));
        
        // Encontra o botão correspondente baseado no texto e adiciona a classe active
        const botoesArray = Array.from(botoes);
        let botaoAlvo;

        if (filtro === 'todos') {
            botaoAlvo = botoesArray.find(b => b.textContent.trim() === 'Clientes Ativos');
        } else if (filtro === 'arquivados') {
            botaoAlvo = botoesArray.find(b => b.textContent.trim() === 'Arquivados');
        } else if (filtro === 'vendidos') {
            botaoAlvo = botoesArray.find(b => b.textContent.trim() === 'Fechados');
        }

        if(botaoAlvo) botaoAlvo.classList.add('active');

        this.carregarLista();
    },

    async carregarLista() {
        const tbody = document.getElementById('lista-clientes-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; vertical-align: middle; padding: 60px 20px; color: #888;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px; color: var(--primary-color);"></i>
                        <span style="font-size: 1.1rem;">Carregando clientes...</span>
                    </div>
                </td>
            </tr>`;

        try {
            const response = await fetch(`/corretores/api/leads?filtro=${this.currentFilter}&_=${new Date().getTime()}`);
            this.leads = await response.json();
            this.renderizar();
        } catch (error) {
            console.error(error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #F44336;">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i><br>
                        Erro ao carregar lista de clientes.
                    </td>
                </tr>`;
        }
    },

    async restaurarLead(id) {
        const confirm = await ModalModule.confirm('Restaurar Lead', 'Deseja restaurar este contato para o funil?');
        if (!confirm) return;

        try {
            // Define status 'Em Atendimento' e mantém o nível numérico que já estava
            const response = await fetch('/corretores/api/leads/info', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status_geral: 'Em Atendimento' })
            });
            
            if (response.ok) {
                this.carregarLista(); // Recarrega a lista
            } else {
                alert('Erro ao restaurar lead.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        }
    },

    visualizarContato(id) {
        const lead = this.leads.find(l => l.id === id);
        if (!lead) return;

        const panel = document.getElementById('lead-details-panel');
        const content = document.getElementById('lead-details-content');
        const overlay = document.getElementById('overlay');

        const telefoneFormatado = UtilsModule.formatarTelefone(lead.telefone);
        const whatsappLink = `https://wa.me/${lead.telefone.replace(/\D/g, '')}`;
        
        // Status Label para o modal
        let statusLabel = lead.status_geral || 'Em Atendimento';
        if (!lead.status_geral) {
             const statusMap = {1: 'Lead', 2: 'Falado', 3: 'Visita', 4: 'Proposta', 5: 'Venda'};
             if(lead.status) statusLabel = statusMap[lead.status] || 'Ativo';
        }

        // Conteúdo simplificado (sem checklist de funil)
        content.innerHTML = `
            <div class="panel-section">
                <span class="panel-label" style="color: var(--primary-color);">
                    <i class="fas fa-info-circle"></i> Detalhes do Contato
                </span>
            </div>

            <div class="panel-section">
                <span class="panel-label">Cliente</span>
                <div class="panel-value" style="font-size: 1.2rem; font-weight: 500;">${escapeHtml(lead.nome)}</div>
                <div style="font-size: 0.9rem; color: #888; margin-top: 5px;">Status: <span style="color: #fff;">${statusLabel}</span></div>
            </div>

            <div class="panel-section">
                <span class="panel-label">Contato</span>
                <div class="panel-value" style="padding: 0; background: transparent; border: none;">
                    <a href="${whatsappLink}" target="_blank" class="phone-link-btn">
                        <span class="phone-number">${telefoneFormatado}</span>
                        <div class="whatsapp-icon-minimal">
                            <i class="fab fa-whatsapp"></i>
                        </div>
                    </a>
                    
                    ${lead.email ? `
                    <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <i class="far fa-envelope" style="color: #aaa;"></i>
                        <span style="color: #ddd; font-size: 0.95rem;">${escapeHtml(lead.email)}</span>
                    </div>` : ''}
                </div>
            </div>

            <div class="panel-section">
                <span class="panel-label">Imóvel de Interesse</span>
                <div class="panel-value">
                    ${escapeHtml(lead.imovel_titulo || 'Geral')}
                    ${lead.imovel_preco ? `<div style="font-size:0.9rem; color:var(--primary-color); margin-top:5px;">${parseFloat(lead.imovel_preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>` : ''}
                </div>
            </div>

            <div class="panel-section">
                <span class="panel-label">Notas</span>
                <div id="panel-comentarios-area-kanban">Loading...</div>
            </div>
        `;

        panel.classList.add('active');
        overlay.classList.add('active');
        
        // Setup close
        const closeBtn = panel.querySelector('.close-panel-btn');
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        const closeAction = () => {
            panel.classList.remove('active');
            if (!document.getElementById('sidebar-lateral').classList.contains('open')) {
                overlay.classList.remove('active');
            }
        };

        newCloseBtn.onclick = closeAction;
        overlay.onclick = () => {
             closeAction();
             document.getElementById('sidebar-lateral').classList.remove('open');
        };

        // Carregar comentários
        KanbanModule.carregarComentarios(lead.id);
    },

    async excluirLead(id) {
        const confirm = await ModalModule.confirm('Excluir Lead', 'Tem certeza que deseja excluir permanentemente este contato?');
        if (!confirm) return;

        try {
            const response = await fetch(`/corretores/api/leads/${id}`, { method: 'DELETE' });
            if (response.ok) {
                this.carregarLista();
            } else {
                alert('Erro ao excluir lead.');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Erro de conexão.');
        }
    },

    renderizar() {
        const tbody = document.getElementById('lista-clientes-body');
        
        if (this.leads.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state" style="padding: 40px;">
                        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        Nenhum cliente encontrado nesta lista.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = '';
        
        this.leads.forEach(lead => {
            const tr = document.createElement('tr');
            tr.onclick = (e) => {
                if(e.target.closest('button') || e.target.closest('a')) return;
                // Abre visualização simples
                ListasModule.visualizarContato(lead.id);
            };

            const telefoneFormatado = UtilsModule.formatarTelefone(lead.telefone);
            const whatsappLink = `https://wa.me/${lead.telefone.replace(/\D/g, '')}`;
            
            // Status Label
            let statusLabel = lead.status_geral || 'Em Atendimento';
            let statusClass = '';
            
            if (lead.status_geral === 'Arquivado') statusClass = 'color: #ff6b6b;';
            else if (lead.status_geral === 'Ignorado') statusClass = 'color: #ff6b6b;';
            else if (lead.status_geral === 'Vendido') statusClass = 'color: #4CAF50;';
            else {
                 // Mapear status numérico se status_geral não for definitivo
                 const statusMap = {1: 'Lead', 2: 'Falado', 3: 'Visita', 4: 'Proposta', 5: 'Venda'};
                 if(lead.status) statusLabel = statusMap[lead.status] || 'Ativo';
            }

            // Botão Restaurar (Seta Curva) se estiver Arquivado ou Ignorado
            let restoreBtn = '';
            if (lead.status_geral === 'Ignorado' || lead.status_geral === 'Arquivado') {
                restoreBtn = `
                    <button class="btn-icon" style="color: #FFC107;" onclick="ListasModule.restaurarLead(${lead.id})" title="Restaurar para o Funil">
                        <i class="fas fa-undo"></i>
                    </button>
                `;
            }

            // Removendo o botão de tasks (3 riscos) conforme solicitado

            tr.innerHTML = `
                <td class="lead-name-cell">${escapeHtml(lead.nome)}</td>
                <td>
                    <div class="lead-contact-cell">
                        <span>${telefoneFormatado}</span>
                        <a href="${whatsappLink}" target="_blank">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </div>
                </td>
                <td style="${statusClass}">${statusLabel}</td>
                <td>${escapeHtml(lead.corretor_nome || '') || '<span style="color:#666;">Sem corretor</span>'}</td>
                <td>
                    <div class="action-btn-group">
                        ${restoreBtn}
                        <button class="btn-icon" onclick="ListasModule.visualizarContato(${lead.id})" title="Ver Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" style="color: #F44336;" onclick="ListasModule.excluirLead(${lead.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
};
