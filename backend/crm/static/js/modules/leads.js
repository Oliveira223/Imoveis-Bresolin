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
            const response = await fetch(`/corretores/api/leads?filtro=novos&_=${new Date().getTime()}`);
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

            const telefoneFormatado = UtilsModule.formatarTelefone(lead.telefone);
            const whatsappLink = `https://wa.me/${lead.telefone.replace(/\D/g, '')}`;
            const imovelTitulo = lead.imovel_titulo || 'Interesse Geral';
            const objetivo = lead.objetivo || '-';

            tr.innerHTML = `
                <td>
                    <div class="col-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                </td>
                <td class="lead-name-cell">${escapeHtml(lead.nome)}</td>
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
                        <span class="interest-title">${escapeHtml(imovelTitulo)}</span>
                        <span class="interest-tag">${escapeHtml(objetivo)}</span>
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

        const telefoneFormatado = UtilsModule.formatarTelefone(lead.telefone);
        const whatsappLink = `https://wa.me/${lead.telefone.replace(/\D/g, '')}`;
        const imovelTitulo = lead.imovel_titulo || 'Interesse Geral';

        this.panelContent.innerHTML = `
            <div class="panel-section">
                <span class="panel-label">Nome do Cliente</span>
                <div class="panel-value">${escapeHtml(lead.nome)}</div>
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
                <span class="panel-label">Interesse</span>
                <div class="panel-value">${escapeHtml(imovelTitulo)}</div>
            </div>
            
            <div class="panel-section">
                <span class="panel-label">Objetivo</span>
                <div class="panel-value">${escapeHtml(lead.objetivo || 'Não informado')}</div>
            </div>

            <div class="panel-section">
                <span class="panel-label">Status</span>
                <div class="panel-value" style="font-size: 0.9rem; color: #888;">
                    Recém chegado
                </div>
            </div>

            <div class="panel-section" style="margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
                <span class="panel-label">Ações</span>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-small-add" style="flex: 1; background: #4CAF50; color: #fff; border: none;" onclick="NovosLeadsModule.moverLead(${lead.id}, 'Atendimento', event)">
                        <i class="fas fa-check"></i> Iniciar Atendimento
                    </button>
                    <button class="btn-small-add" style="flex: 1; background: #F44336; color: #fff; border: none;" onclick="NovosLeadsModule.moverLead(${lead.id}, 'Ignorado', event)">
                        <i class="fas fa-times"></i> Ignorar
                    </button>
                </div>
            </div>
            
            <div class="panel-section">
                <span class="panel-label">Notas</span>
                <div id="panel-comentarios-area-novos">Loading...</div>
            </div>
        `;

        this.panel.classList.add('active');
        this.overlay.classList.add('active');
        
        // Setup close
        const closeBtn = this.panel.querySelector('.close-panel-btn');
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        const closeAction = () => {
            this.panel.classList.remove('active');
            if (!document.getElementById('sidebar-lateral').classList.contains('open')) {
                this.overlay.classList.remove('active');
            }
        };

        newCloseBtn.onclick = closeAction;
        this.overlay.onclick = () => {
             closeAction();
             document.getElementById('sidebar-lateral').classList.remove('open');
        };

        // Carregar comentários
        // Reutiliza a lógica do KanbanModule ou implementa aqui
        // Vamos usar uma função interna para evitar dependência do KanbanModule se possível
        this.carregarComentarios(lead.id);
    },

    async moverLead(id, destino, event) {
        if (event) event.stopPropagation();

        const confirmMsg = destino === 'Atendimento' 
            ? 'Deseja iniciar o atendimento e mover para o Kanban?' 
            : `Deseja mover este lead para ${destino}?`;

        const confirm = await ModalModule.confirm('Mover Lead', confirmMsg);
        if (!confirm) return;

        try {
            // Se for para atendimento, define status=1 (Lead) e limpa status_geral
            // Se for arquivado/ignorado, define status_geral
            
            const body = { id: id };
            if (destino === 'Atendimento') {
                body.status = 1;
                body.status_geral = null; // Limpa flags
            } else {
                body.status_geral = destino;
            }

            const response = await fetch('/corretores/api/leads/info', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                this.panel.classList.remove('active');
                if (!document.getElementById('sidebar-lateral').classList.contains('open')) {
                    this.overlay.classList.remove('active');
                }
                this.carregarNovosLeads();
                
                // Se moveu para atendimento, atualiza o Kanban também se estiver visível
                if (destino === 'Atendimento') {
                    KanbanModule.carregarLeads();
                    SidebarModule.navigateTo('kanban'); // Opcional: focar no kanban
                }
            } else {
                alert('Erro ao mover lead.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        }
    },

    async carregarComentarios(id) {
        const area = document.getElementById('panel-comentarios-area-novos');
        if(!area) return;

        try {
            const response = await fetch(`/corretores/api/leads/${id}/comentarios?_=${new Date().getTime()}`);
            const comentarios = await response.json();
            
            let html = `<div class="comentarios-lista" style="max-height: 200px; overflow-y: auto; margin-bottom: 10px;">`;
            
            if (comentarios.length === 0) html += '<div class="empty-comment">Sem notas.</div>';
            else {
                html += comentarios.map(c => `
                    <div class="comentario-item">
                        <div class="comentario-meta">
                            <span class="comentario-autor">${escapeHtml(c.corretor_nome)}</span>
                            <span class="comentario-data">${c.data_formatada}</span>
                        </div>
                        <div class="comentario-texto">${escapeHtml(c.texto)}</div>
                    </div>`).join('');
            }
            html += '</div>';
            
            html += `
                <div class="novo-comentario-simple">
                    <textarea id="texto-novo-comentario-novos-${id}" placeholder="Nova nota..." style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px; margin-bottom: 5px;"></textarea>
                    <button class="btn-small" onclick="NovosLeadsModule.salvarComentario(${id})">Salvar</button>
                </div>
            `;
            area.innerHTML = html;
        } catch (e) { area.innerHTML = 'Erro ao carregar notas.'; }
    },

    async salvarComentario(id) {
        const txt = document.getElementById(`texto-novo-comentario-novos-${id}`).value;
        if(!txt) return;
        
        await fetch(`/corretores/api/leads/${id}/comentarios`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ texto: txt })
        });
        this.carregarComentarios(id);
    }
};
