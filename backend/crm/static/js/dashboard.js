// ========================
// DASHBOARD CONTROLLER
// ========================

document.addEventListener('DOMContentLoaded', () => {
    console.log('CRM Dashboard Initializing...');

    // 1. Core UI Modules
    SidebarModule.init();
    ClockModule.init();

    // 2. Business Modules
    // Ordem sugerida: Kanban (Principal) -> Outros
    if (typeof KanbanModule !== 'undefined') KanbanModule.init();
    if (typeof NovosLeadsModule !== 'undefined') NovosLeadsModule.init();
    if (typeof ListasModule !== 'undefined') ListasModule.init();
    if (typeof AgendaModule !== 'undefined') AgendaModule.init();

    // 3. Global Event Listeners (se houver)
    
    console.log('CRM Dashboard Initialized.');
});
