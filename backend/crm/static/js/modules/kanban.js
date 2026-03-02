// ========================
// CHECKLIST CONFIG
// ========================
const CHECKLIST_STAGES = {
    1: [ // LEAD (Cadência de Prospecção)
        { type: 'divider', label: 'Contato Inicial' },
        { id: 'tentativa_1', label: 'Tentativa 1', task: true },
        { id: 'tentativa_2', label: 'Tentativa 2', task: true },
        { id: 'tentativa_3', label: 'Tentativa 3', task: true },
        
        { type: 'divider', label: 'Próximo Turno' },
        { id: 'tentativa_4', label: 'Tentativa 4', task: true },
        { id: 'tentativa_5', label: 'Tentativa 5', task: true },
        { id: 'tentativa_6', label: 'Tentativa 6', task: true },
        
        { type: 'divider', label: '24h Depois' },
        { id: 'tentativa_7', label: 'Tentativa 7', task: true },
        { id: 'tentativa_8', label: 'Tentativa 8', task: true },
        { id: 'tentativa_9', label: 'Tentativa 9', task: true },
        
        { type: 'divider', label: 'Conclusão' },
        { id: 'answered', label: 'Cliente Respondeu', action: 'advance' },
        { id: 'ignored', label: 'Sem Resposta' }
    ],
    2: [ // LEADS (Falado)
        { id: 'interest', label: 'Tem Interesse' },
        { id: 'no_interest', label: 'Não tem Interesse' },
        { id: 'schedule_visit', label: 'Visita Agendada', action: 'advance' }
    ],
    3: [ // VISITA
        { id: 'visit_done', label: 'Visita Realizada' },
        { id: 'feedback', label: 'Sem Interesse' },
        { id: 'proposal_made', label: 'Proposta Feita', action: 'advance' }
    ],
    4: [ // PROPOSTA
        { id: 'proposal_sent', label: 'Proposta Enviada' },
        { id: 'negotiation', label: 'Negociação' },
        { id: 'accepted', label: 'Proposta Aceita', action: 'advance' },
        { id: 'denied', label: 'Proposta Negada (Manter no Nível)' }
    ],
    5: [ // VENDA
        { id: 'docs', label: 'Documentação' },
        { id: 'contract', label: 'Contrato Assinado', action: 'sold' }
    ]
};

// ========================
// MÓDULO KANBAN
// ========================
const KanbanModule = {
    leads: [], // Cache de leads do Kanban

    abrirModalNovoLead() {
        document.getElementById('form-novo-lead').reset();
        document.getElementById('modal-novo-lead').classList.add('active');
    },

    async salvarNovoLead() {
        const nome = document.getElementById('novo-lead-nome').value;
        const telefone = document.getElementById('novo-lead-telefone').value;
        const objetivo = document.querySelector('input[name="objetivo"]:checked').value;
        const interesse = document.getElementById('novo-lead-interesse').value;
        const obs = document.getElementById('novo-lead-obs').value;

        if (!nome || !telefone) {
            alert('Nome e Telefone são obrigatórios.');
            return;
        }

        const btnSubmit = document.querySelector('#form-novo-lead button[type="submit"]');
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnSubmit.disabled = true;

        try {
            const response = await fetch('/corretores/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    telefone,
                    objetivo,
                    interesse,
                    observacoes: obs
                })
            });

            const result = await response.json();

            if (result.sucesso) {
                document.getElementById('modal-novo-lead').classList.remove('active');
                this.carregarLeads(); // Recarrega o Kanban
            } else {
                alert('Erro ao salvar lead: ' + (result.erro || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao salvar lead.');
        } finally {
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
        }
    },

    init() {
        this.carregarLeads();
        setInterval(() => this.carregarLeads(), 30000);
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

    recalcularContadores() {
        this.carregarLeads();
    },

    async atualizarStatus(id, status) {
        try {
            await fetch('/corretores/api/leads/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });

            // UPDATE LOCAL CACHE
            const lead = this.leads.find(l => l.id == id);
            if (lead) {
                lead.status = parseInt(status);
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao mover card. Recarregue a página.');
        }
    },

    abrirDetalhes(id) {
        const lead = this.leads.find(l => l.id === id);
        if (!lead) return;
        this.renderizarDetalhes(lead);
    },

    renderizarDetalhes(lead) {
        const panel = document.getElementById('lead-details-panel');
        const content = document.getElementById('lead-details-content');
        const overlay = document.getElementById('overlay');
        
        const currentStage = lead.status;
        const checklistItems = CHECKLIST_STAGES[currentStage] || [];
        const savedChecklist = lead.checklist || {};

        let checklistHtml = '';
        if (checklistItems.length > 0) {
            checklistHtml = `
                <div class="panel-section">
                    <span class="panel-label" style="color: var(--primary-color); margin-bottom: 10px;">
                        <i class="fas fa-tasks"></i> Evolução do Lead
                    </span>
                    <div class="checklist-container">
            `;
            
            checklistItems.forEach((item, index) => {
                // ... (código do renderizarDetalhes mantido, igual ao anterior)
                // Para economizar tokens, vou assumir que a lógica complexa está aqui
                // e apenas copiar o bloco do renderizarDetalhes do passo anterior
                if (item.type === 'divider') {
                    checklistHtml += `<div class="checklist-divider">${item.label}</div>`;
                } else if (item.task) {
                    const isChecked = savedChecklist[item.id];
                    const result = savedChecklist[item.id + '_result'];
                    const isSuccess = isChecked && result === 'success';
                    const isFail = isChecked && result === 'fail';
                    const itemClass = isChecked ? 'checklist-item completed' : 'checklist-item';
                    let labelHtml = `<span>${item.label}</span>`;
                    const safeName = (lead.nome || 'Cliente').replace(/'/g, "\\'").replace(/"/g, "&quot;");
                    const nextAttemptNum = parseInt(item.id.split('_')[1]) + 1;

                    checklistHtml += `
                        <div class="${itemClass}">
                            ${labelHtml}
                            <div class="checklist-actions">
                                <button class="btn-check-action btn-check-success ${isSuccess ? 'active' : ''}" 
                                    title="Atendeu / Sucesso"
                                    onclick="KanbanModule.registrarTentativa(${lead.id}, '${item.id}', true)">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn-check-action btn-check-fail ${isFail ? 'active' : ''}" 
                                    title="Não Atendeu / Falha"
                                    onclick="KanbanModule.registrarTentativa(${lead.id}, '${item.id}', false)">
                                    <i class="fas fa-times"></i>
                                </button>
                                ${isFail ? `<button class="btn-small-add" id="btn-agenda-${nextAttemptNum}" style="margin-left:5px; font-size:0.7rem;" onclick="AgendaModule.criarTarefaAutomatica(${lead.id}, '${safeName}', ${nextAttemptNum}, this)">Agendar Próxima</button>` : ''}
                            </div>
                        </div>
                    `;
                } else if (item.action === 'advance') {
                    const isChecked = savedChecklist[item.id];
                    if (isChecked) {
                        checklistHtml += `
                            <div class="checklist-item" style="justify-content: center; gap: 10px;">
                                <button class="btn-small-add" style="flex: 1; background: rgba(76, 175, 80, 0.1); border: 1px solid #4CAF50; color: #4CAF50; padding: 10px; border-radius: 6px; font-size: 0.9rem; transition: all 0.2s;" 
                                    onmouseover="this.style.background='rgba(76, 175, 80, 0.2)'"
                                    onmouseout="this.style.background='rgba(76, 175, 80, 0.1)'"
                                    onclick="KanbanModule.confirmarAvanco(${lead.id}, ${currentStage})">
                                    <i class="fas fa-check-circle"></i> Avançar Etapa
                                </button>
                                <button class="btn-icon" onclick="KanbanModule.toggleChecklist(${lead.id}, '${item.id}', false, false)" title="Cancelar" style="background: #252525; border: 1px solid #444; width: 40px; height: 40px; border-radius: 6px; color: #888;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    } else {
                        checklistHtml += `
                            <label class="checklist-item">
                                <input type="checkbox" 
                                    onchange="KanbanModule.toggleChecklist(${lead.id}, '${item.id}', false, false)">
                                <span>${item.label}</span>
                            </label>
                        `;
                    }
                } else if (item.action === 'sold') {
                    const isChecked = savedChecklist[item.id];
                    if (isChecked) {
                        checklistHtml += `
                            <div class="checklist-item" style="justify-content: center; gap: 10px;">
                                <button class="btn-small-add" style="flex: 1; background: rgba(33, 150, 243, 0.1); border: 1px solid #2196F3; color: #2196F3; padding: 10px; border-radius: 6px; font-size: 0.9rem; transition: all 0.2s;" 
                                    onmouseover="this.style.background='rgba(33, 150, 243, 0.2)'"
                                    onmouseout="this.style.background='rgba(33, 150, 243, 0.1)'"
                                    onclick="KanbanModule.arquivarLead(${lead.id}, 'Vendido')">
                                    <i class="fas fa-hand-holding-usd"></i> Confirmar Venda
                                </button>
                                <button class="btn-icon" onclick="KanbanModule.toggleChecklist(${lead.id}, '${item.id}', false, false)" title="Cancelar" style="background: #252525; border: 1px solid #444; width: 40px; height: 40px; border-radius: 6px; color: #888;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    } else {
                        checklistHtml += `
                            <label class="checklist-item">
                                <input type="checkbox" 
                                    onchange="KanbanModule.toggleChecklist(${lead.id}, '${item.id}', false, false)">
                                <span>${item.label}</span>
                            </label>
                        `;
                    }
                } else if (item.id === 'ignored' || item.id === 'no_interest' || item.id === 'feedback') {
                    const isChecked = savedChecklist[item.id];
                    const destino = item.id === 'ignored' ? 'Ignorado' : 'Arquivado';
                    const btnLabel = item.id === 'ignored' ? 'Mover para Ignorados' : 'Mover para Arquivados';
                    if (isChecked) {
                        checklistHtml += `
                            <div class="checklist-item" style="justify-content: center; gap: 10px;">
                                <button class="btn-small-add" style="flex: 1; background: #252525; border: 1px solid #444; color: #888; padding: 10px; border-radius: 6px; font-size: 0.9rem; transition: all 0.2s;" 
                                    onmouseover="this.style.borderColor='#F44336'; this.style.color='#F44336'; this.style.background='rgba(244,67,54,0.05)'"
                                    onmouseout="this.style.borderColor='#444'; this.style.color='#888'; this.style.background='#252525'"
                                    onclick="KanbanModule.arquivarLead(${lead.id}, '${destino}')">
                                    <i class="fas fa-archive"></i> ${btnLabel}
                                </button>
                                <button class="btn-icon" onclick="KanbanModule.toggleChecklist(${lead.id}, '${item.id}', false, false)" title="Cancelar" style="background: #252525; border: 1px solid #444; width: 40px; height: 40px; border-radius: 6px; color: #888;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `;
                    } else {
                        checklistHtml += `
                            <label class="checklist-item">
                                <input type="checkbox" 
                                    onchange="KanbanModule.toggleChecklist(${lead.id}, '${item.id}', false, false)">
                                <span>${item.label}</span>
                            </label>
                        `;
                    }
                } else {
                    const isChecked = savedChecklist[item.id] ? 'checked' : '';
                    checklistHtml += `
                        <label class="checklist-item">
                            <input type="checkbox" 
                                ${isChecked} 
                                onchange="KanbanModule.toggleChecklist(${lead.id}, '${item.id}', ${item.trigger || false}, false)">
                            <span>${item.label}</span>
                        </label>
                    `;
                }
            });
            
            checklistHtml += `</div></div>`;
        }

        const telefoneFormatado = UtilsModule.formatarTelefone(lead.telefone);
        const whatsappLink = `https://wa.me/${lead.telefone.replace(/\D/g, '')}`;

        content.innerHTML = `
            ${checklistHtml}
            <div class="panel-section">
                <span class="panel-label">Cliente</span>
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

        this.carregarComentarios(lead.id);
    },

    async registrarTentativa(leadId, itemId, sucesso) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;
        if (!lead.checklist) lead.checklist = {};

        const currentResult = lead.checklist[itemId + '_result'];
        const isChecked = lead.checklist[itemId];

        if (isChecked) {
            if ((sucesso && currentResult === 'success') || (!sucesso && currentResult === 'fail')) {
                lead.checklist[itemId] = false;
                lead.checklist[itemId + '_result'] = null;
            } else {
                lead.checklist[itemId + '_result'] = sucesso ? 'success' : 'fail';
            }
        } else {
            lead.checklist[itemId] = true;
            lead.checklist[itemId + '_result'] = sucesso ? 'success' : 'fail';
        }

        if (sucesso && lead.checklist[itemId]) {
            lead.checklist['answered'] = true;
        }

        try {
            await fetch('/corretores/api/leads/checklist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leadId, checklist: lead.checklist })
            });

            this.abrirDetalhes(leadId);

            if (sucesso && lead.checklist[itemId]) {
                const avancar = await ModalModule.confirm('Sucesso!', 'Cliente atendeu! Deseja mover para "FALADO"?');
                if(avancar) {
                    await this.atualizarStatus(leadId, 2); 
                    document.getElementById('lead-details-panel').classList.remove('active');
                    document.getElementById('overlay').classList.remove('active');
                    this.carregarLeads();
                }
            } 
        } catch (error) {
            console.error('Erro ao registrar tentativa:', error);
            alert('Erro de conexão.');
        }
    },

    async toggleChecklist(leadId, itemId, isTrigger, isTask) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;

        if (!lead.checklist) lead.checklist = {};
        
        const novoEstado = !lead.checklist[itemId];
        lead.checklist[itemId] = novoEstado;

        try {
            await fetch('/corretores/api/leads/checklist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leadId, checklist: lead.checklist })
            });

            this.abrirDetalhes(leadId);

            if (novoEstado && isTask && itemId.startsWith('tentativa_')) {
                const numeroTentativa = parseInt(itemId.split('_')[1]);
                const atendeu = await ModalModule.confirm('Sucesso?', 'O cliente atendeu a ligação/respondeu?');
                
                if (atendeu) {
                    if (!lead.checklist['answered']) {
                        lead.checklist['answered'] = true;
                        await fetch('/corretores/api/leads/checklist', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: leadId, checklist: lead.checklist })
                        });
                        this.abrirDetalhes(leadId);
                    }
                    
                    const avancar = await ModalModule.confirm('Avançar?', 'Ótimo! Deseja mover para "FALADO"?');
                    if(avancar) {
                        await this.atualizarStatus(leadId, 2);
                        document.getElementById('lead-details-panel').classList.remove('active');
                        document.getElementById('overlay').classList.remove('active');
                        this.carregarLeads();
                        return;
                    }
                } else {
                    const proxima = numeroTentativa + 1;
                    if (proxima <= 9) {
                        const agendar = await ModalModule.confirm('Agendar?', `Cliente não atendeu. Agendar "Tentativa ${proxima}" automaticamente?`);
                        if (agendar) {
                            await AgendaModule.criarTarefaAutomatica(leadId, lead.nome, proxima);
                        }
                    } else {
                        alert('Ciclo de tentativas finalizado. Considere mover para "Ignorado".');
                    }
                }
            }

            if (isTrigger && lead.checklist[itemId]) {
                const nextStatus = lead.status + 1;
                
                if (itemId === 'denied' || itemId === 'no_interest') {
                    if(itemId === 'no_interest') {
                         if(await ModalModule.confirm('Arquivar Lead', 'O cliente não tem interesse. Deseja arquivar este lead?')) {
                             await this.arquivarLead(leadId);
                         }
                    }
                    return; 
                }

                if (nextStatus <= 5) {
                    const confirmed = await ModalModule.confirm(
                        'Avançar Etapa',
                        'Checklist completo! Deseja mover este lead para o próximo nível do funil?'
                    );

                    if(confirmed) {
                        await this.atualizarStatus(leadId, nextStatus);
                        document.getElementById('lead-details-panel').classList.remove('active');
                        document.getElementById('overlay').classList.remove('active');
                        this.carregarLeads();
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao salvar checklist:', error);
        }
    },

    async confirmarAvanco(leadId, currentStage) {
        const nextStatus = currentStage + 1;
        
        if (nextStatus <= 5) {
            try {
                const btn = event.target.closest('button');
                if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Avançando...';
                
                await this.atualizarStatus(leadId, nextStatus);
                
                document.getElementById('lead-details-panel').classList.remove('active');
                document.getElementById('overlay').classList.remove('active');
                this.carregarLeads();
            } catch (error) {
                console.error(error);
                alert('Erro ao avançar etapa.');
            }
        }
    },

    async arquivarLead(id, statusDestino = 'Arquivado') {
        try {
            const card = document.querySelector(`.kanban-card[data-id="${id}"]`);
            if(card) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => card.remove(), 300);
            }

            const response = await fetch('/corretores/api/leads/info', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status_geral: statusDestino })
            });
            
            if (response.ok) {
                document.getElementById('lead-details-panel').classList.remove('active');
                document.getElementById('overlay').classList.remove('active');
                this.carregarLeads();
            }
        } catch (e) { console.error(e); }
    },

    async carregarComentarios(id) {
        const area = document.getElementById('panel-comentarios-area-kanban');
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
                    <textarea id="texto-novo-comentario-kanban-${id}" placeholder="Nova nota..." style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 4px; margin-bottom: 5px;"></textarea>
                    <button class="btn-small" onclick="KanbanModule.salvarComentario(${id})">Salvar</button>
                </div>
            `;
            area.innerHTML = html;
        } catch (e) { area.innerHTML = 'Erro ao carregar notas.'; }
    },

    async salvarComentario(id) {
        const txt = document.getElementById(`texto-novo-comentario-kanban-${id}`).value;
        if(!txt) return;
        
        await fetch(`/corretores/api/leads/${id}/comentarios`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ texto: txt })
        });
        this.carregarComentarios(id);
    },

    async carregarLeads() {
        try {
            const response = await fetch(`/corretores/api/leads?filtro=meus&_=${new Date().getTime()}`);
            this.leads = await response.json(); 
            this.renderizarLeads(this.leads);
        } catch (error) {
            console.error("Erro ao carregar leads:", error);
        }
    },

    renderizarLeads(leads) {
        document.querySelectorAll('.column-body').forEach(col => col.innerHTML = '');
        
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const sums = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        leads.forEach(lead => {
            const card = this.criarCard(lead);
            const coluna = document.querySelector(`.kanban-column[data-status="${lead.status}"] .column-body`);
            
            if (coluna) {
                coluna.appendChild(card);
                counts[lead.status]++;
                
                if(lead.imovel_preco) {
                    sums[lead.status] += parseFloat(lead.imovel_preco) || 0;
                }
            }
        });

        Object.keys(counts).forEach(status => {
            const header = document.querySelector(`.kanban-column[data-status="${status}"] .column-header`);
            if (header) {
                const valorFormatado = sums[status].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                const h3 = header.querySelector('h3');
                let titulo = 'STATUS';
                if(header.classList.contains('lead')) titulo = 'LEAD';
                else if(header.classList.contains('contato')) titulo = 'CONTATO';
                else if(header.classList.contains('visita')) titulo = 'VISITA';
                else if(header.classList.contains('proposta')) titulo = 'PROPOSTA';
                else if(header.classList.contains('venda')) titulo = 'VENDA';

                h3.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%">
                        <span>${titulo} <span class="count">${counts[status]}</span></span>
                        <span style="font-size: 0.75rem; opacity: 0.8; font-weight: normal;">${valorFormatado}</span>
                    </div>
                `;
            }
        });
    },

    criarCard(lead) {
        const div = document.createElement('div');
        div.className = 'kanban-card';
        div.draggable = true;
        div.dataset.id = lead.id;

        div.onclick = (e) => {
            if (div.classList.contains('dragging')) return;
            if(e.target.closest('a')) return;
            this.abrirDetalhes(lead.id);
        };

        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', lead.id);
            div.classList.add('dragging');
            setTimeout(() => div.classList.add('is-dragging'), 0);
        });

        div.addEventListener('dragend', () => {
            div.classList.remove('dragging');
            div.classList.remove('is-dragging');
        });
        
        const tagClass = lead.objetivo === 'Investimento' ? 'tag-investimento' : 'tag-moradia';
        const imovelTitulo = lead.imovel_titulo || 'Interesse Geral';
        const precoFormatado = lead.imovel_preco 
            ? parseFloat(lead.imovel_preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) 
            : '';
        const whatsappLink = `https://wa.me/${lead.telefone.replace(/\D/g, '')}`;
        const telefoneVisual = UtilsModule.formatarTelefone(lead.telefone);

        div.innerHTML = `
            <div class="card-title">${escapeHtml(lead.nome)}</div>
            <div class="card-info">
                <i class="fas fa-home"></i> ${escapeHtml(imovelTitulo)}<br>
                ${precoFormatado ? `<span style="font-size:0.8rem; color:#aaa; margin-left: 24px;">${precoFormatado}</span><br>` : ''}
                <span style="color: #aaa;">
                    <i class="fab fa-whatsapp"></i> ${telefoneVisual}
                </span>
            </div>
            <div class="card-footer">
                <span class="tag ${tagClass}">${escapeHtml(lead.objetivo || 'Não informado')}</span>
                <span>${lead.data_formatada}</span>
            </div>
        `;
        
        return div;
    }
};
