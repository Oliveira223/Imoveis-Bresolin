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
