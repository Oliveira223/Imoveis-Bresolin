// ===========================
// EDITAR IMÓVEL - SCRIPT COMPLETO
// ===========================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-editar-imovel");
  const id = form.elements["id"].value;

  const cloudName = 'dexpbb2dd';
  const uploadPreset = 'bresolin';

  const inputImagemPrincipal = document.getElementById("file-imagem-principal");
  const previewImagemPrincipal = document.getElementById("preview-imagem-principal");
  const hiddenImagemPrincipal = document.getElementById("input-imagem-principal");

  const inputSecundarias = document.getElementById("file-secundarias");
  const galeriaSecundarias = document.getElementById("galeria-secundarias");

  const inputPlantas = document.getElementById("file-plantas");
  const galeriaPlantas = document.getElementById("galeria-plantas");

  const imagensSecundariasNovas = [];
  const plantasNovas = [];

  // ===========================
  // Formatação Monetária (Auto-format)
  // ===========================
  const formatarMoedaInput = (input) => {
    if (!input) return;
    
    // Função para aplicar a máscara
    const aplicarMascara = (el) => {
      let valor = el.value.replace(/\D/g, '');
      if (valor === '') {
        el.value = '';
        return;
      }
      
      const numero = parseInt(valor) / 100;
      el.value = numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    // Formata valor inicial se houver
    if (input.value) {
        // Se vier do banco como 120000.00, converte para string "12000000" (centavos)
        // Se vier vazio, ignora
        let val = parseFloat(input.value).toFixed(2).replace('.', '');
        input.value = val;
        aplicarMascara(input);
    }

    input.addEventListener('input', (e) => {
      aplicarMascara(e.target);
    });
  };

  // Aplica aos campos de preço
  formatarMoedaInput(document.getElementById('preco'));
  // Adicione outros campos se necessário (iptu, condominio) se existirem no form de edição

  // ===========================
  // Configuração de Reordenação (SortableJS)
  // ===========================

  const initSortable = (containerId) => {
    const el = document.getElementById(containerId);
    if (!el) return;

    Sortable.create(el, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      handle: '.imagem-container', // Permite arrastar clicando em qualquer lugar do container
      onEnd: async () => {
        const ids = Array.from(el.querySelectorAll('.imagem-container'))
                         .map(item => item.dataset.id)
                         .filter(id => id); // Apenas imagens que já estão no banco (têm ID)

        if (ids.length > 0) {
          try {
            const response = await fetch(`/api/imoveis/${id}/imagens/reordenar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ordem_ids: ids })
            });
            if (!response.ok) throw new Error('Erro ao salvar nova ordem');
            console.log(`Ordem da galeria ${containerId} atualizada!`);
          } catch (err) {
            console.error(err);
            alert('Erro ao salvar a nova ordem das imagens.');
          }
        }
      }
    });
  };

  initSortable('galeria-secundarias');
  initSortable('galeria-plantas');

  // ===========================
  // Upload da imagem principal
  // ===========================

  inputImagemPrincipal.onchange = async function () {
    const file = this.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    hiddenImagemPrincipal.value = data.secure_url;
    previewImagemPrincipal.src = data.secure_url;
    previewImagemPrincipal.style.display = 'block';
  };

  // ===========================
  // Upload de imagens secundárias (mantém previews existentes)
  // ===========================

  inputSecundarias.onchange = async function () {
    const files = Array.from(this.files);

    if (!files.length) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      imagensSecundariasNovas.push(data.secure_url);

      const img = document.createElement('img');
      img.src = data.secure_url;
      img.className = 'thumb-secundaria';
      galeriaSecundarias.appendChild(img);
    }

    // Limpa input para permitir reenvio dos mesmos arquivos se necessário
    this.value = '';
  };

  // ===========================
  // Upload de plantas (mantém previews existentes)
  // ===========================

  inputPlantas.onchange = async function () {
    const files = Array.from(this.files);

    if (!files.length) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      plantasNovas.push(data.secure_url);

      const img = document.createElement('img');
      img.src = data.secure_url;
      img.className = 'thumb-secundaria';
      galeriaPlantas.appendChild(img);
    }

    this.value = '';
  };

  // ===========================
  // Envio dos dados do imóvel
  // ===========================

  form.onsubmit = async function (e) {
    e.preventDefault();
  
    const data = Object.fromEntries(new FormData(form));
  
    // Conversões numéricas e lógicas
    data.ativo = form.ativo.checked;
    data.piscina = document.getElementById("piscina").checked;
    data.churrasqueira = document.getElementById("churrasqueira").checked;
    
    // Limpa formatação monetária antes de enviar
    const limparMoeda = (val) => {
        if (!val) return null;
        // Remove pontos de milhar e troca vírgula por ponto
        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
    };

    data.preco = limparMoeda(data.preco);
    
    data.area = parseFloat(data.area) || null;
    data.quartos = parseInt(data.quartos) || null;
    data.vagas = parseInt(data.vagas) || null;
    data.andar = parseInt(data.andar) || null;
    data.suites = parseInt(data.suites) || null;
    data.banheiros = parseInt(data.banheiros) || null;
    data.banheiros_com_chuveiro = parseInt(data.banheiros_com_chuveiro) || null;
  
    // Garantir que todos os campos obrigatórios estejam presentes
    data.tipo = data.tipo || '';
    data.bairro = data.bairro || '';
    data.cidade = data.cidade || '';
    data.uf = data.uf || '';
    data.descricao = data.descricao || '';
    data.imagem = data.imagem || '';
    data.endereco = data.endereco || '';
    data.empreendimento_id = data.empreendimento_id || null;
    data.valor_condominio = parseFloat(data.valor_condominio) || 0;
  
    try {
      // Atualiza os dados principais via PUT
      const res = await fetch(`/api/imoveis/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Erro ao atualizar imóvel");

      // Envia novas imagens secundárias (se houver)
      await Promise.all(imagensSecundariasNovas.map(url =>
        fetch(`/api/imoveis/${id}/imagens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, tipo: 'secundaria' })
        })
      ));

      // Envia novas plantas (se houver)
      await Promise.all(plantasNovas.map(url =>
        fetch(`/api/imoveis/${id}/plantas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, tipo: 'planta' })
        })
      ));

      alert("Imóvel atualizado com sucesso!");
      // Opcional: recarregar a página ou voltar para o dashboard
      window.location.href = '/admin';

    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar imóvel.");
    }
  };
});
