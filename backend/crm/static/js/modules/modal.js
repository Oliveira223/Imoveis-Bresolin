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
