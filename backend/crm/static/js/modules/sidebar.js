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
        
        // Agora navega para a view completa
        if(btnAgenda) {
            btnAgenda.onclick = () => {
                SidebarModule.navigateTo('agenda');
            };
        }
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
