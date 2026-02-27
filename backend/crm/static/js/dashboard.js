
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização
    KanbanModule.init();
    SidebarModule.init();
});

// ========================
// MÓDULO SIDEBAR & UI
// ========================
const SidebarModule = {
    init() {
        const btnNotif = document.getElementById('btn-toggle-notifications');
        const sidebarRight = document.getElementById('notifications-panel');
        const btnClose = document.querySelector('.close-panel');

        if (btnNotif && sidebarRight) {
            btnNotif.addEventListener('click', () => {
                sidebarRight.classList.toggle('open');
            });
        }

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                sidebarRight.classList.remove('open');
            });
        }
    }
};

// ========================
// MÓDULO KANBAN
// ========================
const KanbanModule = {
    init() {
        this.carregarLeads();
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
        
        const tagClass = lead.objetivo === 'Investimento' ? 'tag-investimento' : 'tag-moradia';

        div.innerHTML = `
            <div class="card-title">${lead.nome}</div>
            <div class="card-info">
                <i class="fas fa-home"></i> ${lead.imovel}<br>
                <i class="fas fa-phone"></i> ${lead.telefone}
            </div>
            <div class="card-footer">
                <span class="tag ${tagClass}">${lead.objetivo}</span>
                <span>${lead.data}</span>
            </div>
        `;
        
        return div;
    }
};
