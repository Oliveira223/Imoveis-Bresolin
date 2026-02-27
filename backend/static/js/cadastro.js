// ================================
// cadastro.js - Bresolin Imóveis
// Sistema de Cadastro de Interesse
// ================================

$(document).ready(function() {
    // Elementos do DOM
    const form = $('#form-interesse');
    const btnSubmit = $('#btn-submit');
    const btnText = $('.btn-text');
    const btnLoading = $('.btn-loading');
    const mensagemSucesso = $('#mensagem-sucesso');
    const mensagemErro = $('#mensagem-erro');
    const textoErro = $('#texto-erro');
    
    // Campos do formulário
    const nomeInput = $('#nome');
    const emailInput = $('#email');
    const whatsappInput = $('#whatsapp');

    // Máscara para WhatsApp
    whatsappInput.on('input', function() {
        // Remove tudo que não for dígito
        let value = this.value.replace(/\D/g, '');
        
        // Limita a 11 dígitos (DDD + 9 dígitos)
        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        // Aplica a formatação
        if (value.length <= 2) {
            // (11
            value = value.replace(/(\d{0,2})/, '($1');
        } else if (value.length <= 7) {
            // (11) 91234
            value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        } else {
            // (11) 91234-5678
            value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
        
        this.value = value;
    });

    // Validação em tempo real
    function validarCampo(campo, validacao, mensagem) {
        campo.on('blur', function() {
            const valor = $(this).val().trim();
            
            if (!validacao(valor)) {
                $(this).addClass('erro');
                mostrarErroTemporario(mensagem);
            } else {
                $(this).removeClass('erro');
            }
        });
    }

    // Validações específicas
    validarCampo(nomeInput, 
        valor => valor.length >= 2,
        'Nome deve ter pelo menos 2 caracteres'
    );

    validarCampo(emailInput, 
        valor => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor),
        'Digite um e-mail válido'
    );

    validarCampo(whatsappInput, 
        valor => valor.replace(/\D/g, '').length >= 10,
        'WhatsApp deve ter pelo menos 10 dígitos'
    );

    // Função para mostrar erro temporário
    function mostrarErroTemporario(mensagem) {
        textoErro.text(mensagem);
        mensagemErro.fadeIn(300);
        
        setTimeout(() => {
            mensagemErro.fadeOut(300);
        }, 3000);
    }

    // Função para validar formulário completo
    function validarFormulario() {
        const nome = nomeInput.val().trim();
        const email = emailInput.val().trim();
        const whatsapp = whatsappInput.val().replace(/\D/g, '');

        // Validar nome
        if (nome.length < 2) {
            mostrarErroTemporario('Nome deve ter pelo menos 2 caracteres');
            nomeInput.focus();
            return false;
        }

        // Validar email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            mostrarErroTemporario('Digite um e-mail válido');
            emailInput.focus();
            return false;
        }

        // Validar WhatsApp
        if (whatsapp.length < 10) {
            mostrarErroTemporario('WhatsApp deve ter pelo menos 10 dígitos');
            whatsappInput.focus();
            return false;
        }

        return true;
    }

    // Função para mostrar loading
    function mostrarLoading() {
        btnSubmit.prop('disabled', true);
        btnText.hide();
        btnLoading.show();
    }

    // Função para esconder loading
    function esconderLoading() {
        btnSubmit.prop('disabled', false);
        btnText.show();
        btnLoading.hide();
    }

    // Função para mostrar sucesso
    function mostrarSucesso() {
        form.fadeOut(300, function() {
            mensagemSucesso.fadeIn(300);
        });
        
        // Redirecionar após 3 segundos
        setTimeout(() => {
            window.location.href = '/';
        }, 3000);
    }

    // Função para mostrar erro
    function mostrarErro(mensagem) {
        textoErro.text(mensagem);
        mensagemErro.fadeIn(300);
        
        setTimeout(() => {
            mensagemErro.fadeOut(300);
        }, 5000);
    }

    // Envio do formulário
    form.on('submit', async function(e) {
        e.preventDefault();
        
        // Esconder mensagens anteriores
        mensagemSucesso.hide();
        mensagemErro.hide();
        
        // Validar formulário
        if (!validarFormulario()) {
            return;
        }
        
        // Mostrar loading
        mostrarLoading();
        
        // Preparar dados
        const dados = {
            nome: nomeInput.val().trim(),
            email: emailInput.val().trim(),
            whatsapp: whatsappInput.val().trim(),
            objetivo: $('input[name="objetivo"]:checked').val(),
            imovel_interesse_id: $('#imovel_interesse_id').val()
        };
        
        try {
            // Enviar dados
            const response = await fetch('/api/interesse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dados)
            });
            
            const resultado = await response.json();
            
            if (response.ok && resultado.sucesso) {
                mostrarSucesso();
            } else {
                throw new Error(resultado.erro || 'Erro ao cadastrar interesse');
            }
            
        } catch (error) {
            console.error('Erro ao enviar formulário:', error);
            mostrarErro(error.message || 'Erro ao cadastrar interesse. Tente novamente.');
        } finally {
            esconderLoading();
        }
    });

    // Animações de entrada
    $('.cadastro-card').css('opacity', '0').animate({
        opacity: 1
    }, 600);

    // Efeitos visuais nos inputs
    $('input').on('focus', function() {
        $(this).parent().addClass('focused');
    }).on('blur', function() {
        $(this).parent().removeClass('focused');
    });

    // Remover classe de erro ao digitar
    $('input').on('input', function() {
        $(this).removeClass('erro');
    });

    // Adicionar estilos CSS dinâmicos para estados de erro
    $('<style>').text(`
        .form-group input.erro {
            border-color: #f44336 !important;
            box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1) !important;
        }
        
        .form-group.focused label {
            color: #4a9eff;
        }
        
        .form-group input:valid {
            border-color: #4caf50;
        }
    `).appendTo('head');

    // Log para debug
    console.log('Sistema de cadastro de interesse inicializado');
});