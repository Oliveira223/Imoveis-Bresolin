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
