
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização
    KanbanModule.init();
    NovosLeadsModule.init(); // Inicia o módulo de novos leads
    ListasModule.init();
    AgendaModule.init();
    ClockModule.init();
    SidebarModule.init();
});

// ========================
// Helper XSS Protection
// ========================
function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ========================
// UTILS MODULE
// ========================
const UtilsModule = {
    formatarTelefone(telefone) {
        if (!telefone) return '';
        // Remove tudo que não é dígito
        let numero = telefone.replace(/\D/g, '');
        
        // Se começar com 55 e tiver mais de 11 dígitos (ex: 5555999999999), remove o DDI 55
        if (numero.startsWith('55') && numero.length > 11) {
            numero = numero.substring(2);
        }

        // Formato (XX) XXXXX-XXXX
        if (numero.length === 11) {
            return `(${numero.substring(0, 2)}) ${numero.substring(2, 7)}-${numero.substring(7)}`;
        } 
        // Formato (XX) XXXX-XXXX
        else if (numero.length === 10) {
            return `(${numero.substring(0, 2)}) ${numero.substring(2, 6)}-${numero.substring(6)}`;
        }
        
        return telefone; // Retorna original se não reconhecer
    },

    mascaraTelefoneInput(input) {
        let valor = input.value.replace(/\D/g, '');
        
        // Limita a 11 dígitos
        if (valor.length > 11) valor = valor.slice(0, 11);
        
        if (valor.length > 10) {
            // (11) 91234-5678
            valor = valor.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
        } else if (valor.length > 6) {
             // (11) 9123-4567
            valor = valor.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
        } else if (valor.length > 2) {
            // (11) 91234
            valor = valor.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
        } else {
            if(valor.length > 0) valor = valor.replace(/^(\d*)/, "($1");
        }
        
        input.value = valor;
    },
};

// ========================
// MODAL MODULE
// ========================
const ModalModule = {
    resolvePromise: null,

    confirm(title, message) {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-message').textContent = message;
            
            document.getElementById('custom-modal').classList.add('active');
        });
    },

    close(result) {
        document.getElementById('custom-modal').classList.remove('active');
        if (this.resolvePromise) {
            this.resolvePromise(result);
            this.resolvePromise = null;
        }
    }
};

// ========================
// MÓDULO RELÓGIO
// ========================
const ClockModule = {
    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 60000); // Atualiza a cada minuto
    },

    updateClock() {
        const now = new Date();
        const element = document.getElementById('topbar-clock');
        if (!element) return;

        // Formato: Mês (Abrev), Dia | Hora:Minuto
        // Ex: Mar, 2 | 12:34
        
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mes = meses[now.getMonth()];
        const dia = now.getDate();
        const hora = String(now.getHours()).padStart(2, '0');
        const minuto = String(now.getMinutes()).padStart(2, '0');
        
        element.textContent = `${mes}, ${dia} | ${hora}:${minuto}`;
    }
};

// ========================
// MÓDULO SIDEBAR
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
// MÓDULO AGENDA (Tarefas)
// ========================
const AgendaModule = {
    tarefas: [],

    init() {
        this.carregarTarefas();
        // Atualiza a cada minuto
        setInterval(() => this.carregarTarefas(), 60000);
    },

    async carregarTarefas() {
        try {
            const response = await fetch('/corretores/api/tarefas?_=${new Date().getTime()}');
            this.tarefas = await response.json();
            this.renderizarAgenda();
        } catch (error) {
            console.error('Erro ao carregar agenda:', error);
        }
    },

    renderizarAgenda() {
        const container = document.querySelector('.agenda-content');
        if (!container) return;

        if (this.tarefas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="far fa-calendar-check"></i>
                    <p>Nenhuma tarefa pendente.</p>
                </div>`;
            return;
        }

        let html = '';
        this.tarefas.forEach(t => {
            const classeConcluida = t.concluida ? 'concluida' : '';
            html += `
                <div class="agenda-task ${classeConcluida}">
                    <div class="task-check" onclick="AgendaModule.toggleTarefa(${t.id}, ${!t.concluida})">
                        ${t.concluida ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-info">
                        <div class="task-text">${escapeHtml(t.descricao)}</div>
                        <div class="task-meta">
                            ${t.cliente_nome ? `<i class="fas fa-user"></i> ${escapeHtml(t.cliente_nome)} &bull; ` : ''}
                            <i class="far fa-clock"></i> ${t.data_formatada || 'Sem data'}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    async toggleTarefa(id, concluida) {
        // Atualização otimista
        const tarefa = this.tarefas.find(t => t.id === id);
        if(tarefa) tarefa.concluida = concluida;
        this.renderizarAgenda();

        try {
            await fetch(`/corretores/api/tarefas/${id}/concluir`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ concluida })
            });
        } catch (error) {
            console.error('Erro ao concluir tarefa:', error);
            // Reverte em caso de erro
            if(tarefa) tarefa.concluida = !concluida;
            this.renderizarAgenda();
        }
    },

    async criarTarefaAutomatica(leadId, nomeLead, tipoTentativa, btnElement) {
        console.log('Iniciando criação automática de tarefa:', { leadId, nomeLead, tipoTentativa });
        
        if (btnElement) {
            btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btnElement.disabled = true;
        }
        
        // Lógica de Agendamento Inteligente
        const now = new Date();
        const dataLimite = new Date(now);
        
        // Tentativas 1-3: +10 minutos
        if (tipoTentativa <= 3) {
            dataLimite.setMinutes(dataLimite.getMinutes() + 10);
        } 
        // Tentativas 4-6: Próximo Turno
        else if (tipoTentativa <= 6) {
            const horaAtual = now.getHours();
            
            if (horaAtual < 12) {
                // Manhã -> Tarde (mesmo dia 14h)
                dataLimite.setHours(14, 0, 0, 0);
            } else {
                // Tarde/Noite -> Manhã seguinte (dia seguinte 9h)
                dataLimite.setDate(dataLimite.getDate() + 1);
                dataLimite.setHours(9, 0, 0, 0);
            }
            
            // Se cair no fim de semana, move para segunda? (Opcional, manter simples por enquanto)
        } 
        // Tentativas 7-9: +24 horas
        else {
            dataLimite.setDate(dataLimite.getDate() + 1);
            // Mantém a mesma hora ou define horário comercial? Vamos manter +24h exatos.
        }

        // Formata para o banco (YYYY-MM-DD HH:MM:SS)
        // Ajuste para timezone local simples
        const year = dataLimite.getFullYear();
        const month = String(dataLimite.getMonth() + 1).padStart(2, '0');
        const day = String(dataLimite.getDate()).padStart(2, '0');
        const hour = String(dataLimite.getHours()).padStart(2, '0');
        const minute = String(dataLimite.getMinutes()).padStart(2, '0');
        const second = String(dataLimite.getSeconds()).padStart(2, '0');
        
        const dataStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

        const descricao = `Ligar para ${nomeLead} - Tentativa ${tipoTentativa}`;

        try {
            const response = await fetch('/corretores/api/tarefas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_id: leadId,
                    descricao: descricao,
                    data_limite: dataStr,
                    tipo: 'Ligação'
                })
            });
            
            const result = await response.json();
            if (response.ok) {
                console.log('Tarefa criada com sucesso!', result);
                if (btnElement) {
                    btnElement.innerHTML = '<i class="fas fa-check"></i> Agendado';
                    btnElement.classList.add('btn-success');
                } else {
                    alert('Tarefa agendada na sua agenda!');
                }
                // Recarrega agenda
                this.carregarTarefas();
                return true;
            } else {
                console.error('Erro na resposta da API:', result);
                if (btnElement) {
                    btnElement.innerHTML = 'Erro';
                    btnElement.disabled = false;
                }
                return false;
            }
        } catch (e) {
            console.error('Erro ao criar tarefa auto (catch):', e);
            if (btnElement) {
                btnElement.innerHTML = 'Erro';
                btnElement.disabled = false;
            }
            return false;
        }
    },
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
        // Reutiliza o painel do NovosLeadsModule por simplicidade
        const panel = document.getElementById('lead-details-panel');
        const content = document.getElementById('lead-details-content');
        const overlay = document.getElementById('overlay');
        
        // Checklist Logic
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
                if (item.type === 'divider') {
                    checklistHtml += `<div class="checklist-divider">${item.label}</div>`;
                } else if (item.task) {
                    // Item de Tentativa (Botões Inline)
                    const isChecked = savedChecklist[item.id]; // true se feito
                    const result = savedChecklist[item.id + '_result']; // 'success' ou 'fail'
                    
                    const isSuccess = isChecked && result === 'success';
                    const isFail = isChecked && result === 'fail';
                    
                    const itemClass = isChecked ? 'checklist-item completed' : 'checklist-item';
                    
                    // Lógica para mostrar botão "Agendar" na próxima tentativa se a anterior falhou
                    let labelHtml = `<span>${item.label}</span>`;
                    
                    // Verifica se o item anterior foi uma tentativa falha
                    // Precisa achar a tentativa anterior na lista linear
                    // Simplificação: Se este item não está feito, e o lead não respondeu ainda...
                    // Melhor: O usuário clica no "X", e o sistema apenas registra.
                    // O botão "Agendar" pode ser um botão extra ou substituir o label.
                    
                    // Se o item anterior falhou e este está pendente, destacar como sugestão?
                    // Por enquanto, vamos focar na funcionalidade básica de toggle e remover modal.
                    
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
                    // Item de Avanço de Fase (Botão de Avançar / Cancelar)
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
                    // Item de Venda Concluída (Botão de Vender / Cancelar)
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
                    // Item Especial: Sem Resposta (Ignorado) ou Sem Interesse/Feedback Negativo (Arquivado)
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
                    // Item Comum (Checkbox)
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
        
        // Setup close
        const closeBtn = panel.querySelector('.close-panel-btn');
        // Precisamos clonar o botão para remover listeners antigos se houver
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
             // Mantém comportamento original do overlay se precisar
             closeAction();
             document.getElementById('sidebar-lateral').classList.remove('open');
        };

        // Carregar comentários (reutilizando a função do NovosLeadsModule mas apontando para o ID correto)
        // Precisamos de uma função genérica de comentários. Vamos adaptar.
        this.carregarComentarios(lead.id);
    },

    async registrarTentativa(leadId, itemId, sucesso) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;
        if (!lead.checklist) lead.checklist = {};

        const currentResult = lead.checklist[itemId + '_result'];
        const isChecked = lead.checklist[itemId];

        // Toggle Logic
        if (isChecked) {
            // Se clicou no mesmo botão -> Desmarca
            if ((sucesso && currentResult === 'success') || (!sucesso && currentResult === 'fail')) {
                lead.checklist[itemId] = false;
                lead.checklist[itemId + '_result'] = null;
            } else {
                // Se clicou no outro -> Troca
                lead.checklist[itemId + '_result'] = sucesso ? 'success' : 'fail';
            }
        } else {
            // Marca novo
            lead.checklist[itemId] = true;
            lead.checklist[itemId + '_result'] = sucesso ? 'success' : 'fail';
        }

        // Se Sucesso -> Marca 'answered' também
        if (sucesso && lead.checklist[itemId]) {
            lead.checklist['answered'] = true;
        }

        // Salva Backend
        try {
            await fetch('/corretores/api/leads/checklist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leadId, checklist: lead.checklist })
            });

            // Atualiza UI localmente (Recarrega painel)
            this.abrirDetalhes(leadId);

            // Lógica de Negócio (Apenas para Sucesso)
            if (sucesso && lead.checklist[itemId]) {
                // Sucesso -> Sugere Avançar
                const avancar = await ModalModule.confirm('Sucesso!', 'Cliente atendeu! Deseja mover para "FALADO"?');
                if(avancar) {
                    await this.atualizarStatus(leadId, 2); // 2 = FALADO
                    document.getElementById('lead-details-panel').classList.remove('active');
                    document.getElementById('overlay').classList.remove('active');
                    this.carregarLeads();
                }
            } 
            // Para Falha: Não faz nada (o botão de agendar aparece na UI)
        } catch (error) {
            console.error('Erro ao registrar tentativa:', error);
            alert('Erro de conexão.');
        }
    },

    async toggleChecklist(leadId, itemId, isTrigger, isTask) {
        const lead = this.leads.find(l => l.id === leadId);
        if (!lead) return;

        // Inicializa se não existir
        if (!lead.checklist) lead.checklist = {};
        
        // Toggle state
        const novoEstado = !lead.checklist[itemId];
        lead.checklist[itemId] = novoEstado;

        // Save to backend
        try {
            await fetch('/corretores/api/leads/checklist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: leadId, checklist: lead.checklist })
            });

            // Atualiza UI para refletir mudanças (ex: checkbox virar botão)
            this.abrirDetalhes(leadId);

            // Lógica de Tentativas (Se marcou e é uma tarefa de tentativa)
            if (novoEstado && isTask && itemId.startsWith('tentativa_')) {
                const numeroTentativa = parseInt(itemId.split('_')[1]);
                
                // Pergunta se teve sucesso
                const atendeu = await ModalModule.confirm('Sucesso?', 'O cliente atendeu a ligação/respondeu?');
                
                if (atendeu) {
                    // Marca "Respondeu" automaticamente
                    if (!lead.checklist['answered']) {
                        lead.checklist['answered'] = true;
                        // Salva novamente
                        await fetch('/corretores/api/leads/checklist', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: leadId, checklist: lead.checklist })
                        });
                        // Recarrega painel para mostrar check
                        this.abrirDetalhes(leadId);
                    }
                    
                    // Trigger de avanço
                    const avancar = await ModalModule.confirm('Avançar?', 'Ótimo! Deseja mover para "FALADO"?');
                    if(avancar) {
                        await this.atualizarStatus(leadId, 2); // 2 = FALADO
                        document.getElementById('lead-details-panel').classList.remove('active');
                        document.getElementById('overlay').classList.remove('active');
                        this.carregarLeads();
                        return;
                    }
                } else {
                    // Não atendeu -> Agendar próxima
                    const proxima = numeroTentativa + 1;
                    if (proxima <= 9) {
                        const agendar = await ModalModule.confirm('Agendar?', `Cliente não atendeu. Agendar "Tentativa ${proxima}" automaticamente?`);
                        if (agendar) {
                            await AgendaModule.criarTarefaAutomatica(leadId, lead.nome, proxima);
                        }
                    } else {
                        // Fim das tentativas
                        alert('Ciclo de tentativas finalizado. Considere mover para "Ignorado".');
                    }
                }
            }

            // Check trigger (Lógica antiga mantida para outras fases)
            if (isTrigger && lead.checklist[itemId]) {
                const nextStatus = lead.status + 1;
                
                // Lógica customizada de transição
                if (itemId === 'denied' || itemId === 'no_interest') {
                    // Aqui poderíamos mover para "Arquivado" ou manter no nível
                    // Por enquanto vamos apenas alertar ou fazer uma lógica especial
                    if(itemId === 'no_interest') {
                         if(await ModalModule.confirm('Arquivar Lead', 'O cliente não tem interesse. Deseja arquivar este lead?')) {
                             // Mover para arquivado (status_geral)
                             // Precisamos implementar isso no backend ou usar a rota existente
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
                        // Fechar painel e recarregar
                        document.getElementById('lead-details-panel').classList.remove('active');
                        document.getElementById('overlay').classList.remove('active');
                        this.carregarLeads(); // Recarrega tudo para refletir mudança
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
                // Efeito visual no botão (opcional)
                const btn = event.target.closest('button');
                if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Avançando...';
                
                await this.atualizarStatus(leadId, nextStatus);
                
                // Fechar painel e recarregar
                document.getElementById('lead-details-panel').classList.remove('active');
                document.getElementById('overlay').classList.remove('active');
                this.carregarLeads(); // Recarrega tudo para refletir mudança
            } catch (error) {
                console.error(error);
                alert('Erro ao avançar etapa.');
            }
        }
    },

    async arquivarLead(id, statusDestino = 'Arquivado') {
        try {
            // Remoção Otimista da UI
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
        // Reutiliza lógica de UI do NovosLeadsModule mas injeta no lugar certo
        // Hack: Usamos a função do NovosLeadsModule mas alteramos o ID alvo temporariamente ou duplicamos a função.
        // Vamos duplicar simplificando para evitar dependência cruzada complexa.
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
            this.leads = await response.json(); // Salva na memória
            this.renderizarLeads(this.leads);
        } catch (error) {
            console.error("Erro ao carregar leads:", error);
        }
    },

    renderizarLeads(leads) {
        // Limpar colunas
        document.querySelectorAll('.column-body').forEach(col => col.innerHTML = '');
        
        // Contadores e Somatórios
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const sums = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        leads.forEach(lead => {
            const card = this.criarCard(lead);
            const coluna = document.querySelector(`.kanban-column[data-status="${lead.status}"] .column-body`);
            
            if (coluna) {
                coluna.appendChild(card);
                counts[lead.status]++;
                
                // Somar valor (assumindo que imovel_preco vem como número ou string convertível)
                if(lead.imovel_preco) {
                    sums[lead.status] += parseFloat(lead.imovel_preco) || 0;
                }
            }
        });

        // Atualizar contadores na UI
        Object.keys(counts).forEach(status => {
            const header = document.querySelector(`.kanban-column[data-status="${status}"] .column-header`);
            if (header) {
                // Formatar moeda
                const valorFormatado = sums[status].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
                
                // Atualiza ou cria estrutura
                // Vamos refazer o HTML interno do H3 para incluir o valor
                const h3 = header.querySelector('h3');
                // Título original baseado na classe (gambiarra leve mas funcional)
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

        // Click para abrir detalhes
        div.onclick = (e) => {
            // Evita abrir se estiver arrastando (simples verificação de tempo ou classe)
            if (div.classList.contains('dragging')) return;
            
            if(e.target.closest('a')) return; // Se clicar no link do whats não abre
            this.abrirDetalhes(lead.id);
        };

        div.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', lead.id);
            div.classList.add('dragging');
            // Timeout para evitar que o clique seja disparado imediatamente
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
            const response = await fetch(`/corretores/api/leads/${id}/comentarios?_=${new Date().getTime()}`);
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
                            <span class="comentario-autor">${escapeHtml(c.corretor_nome || 'Sistema')}</span>
                            <span class="comentario-data">${c.data_formatada}</span>
                        </div>
                        <div class="comentario-texto">${escapeHtml(c.texto)}</div>
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
