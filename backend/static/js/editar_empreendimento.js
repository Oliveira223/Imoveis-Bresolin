// ===========================
// EDITAR EMPREENDIMENTO - SCRIPT COMPLETO
// ===========================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-editar-empreendimento");
  const id = form.elements["id"].value;

  const cloudName = 'dexpbb2dd';
  const uploadPreset = 'bresolin';

  const inputImagemPrincipal = document.getElementById("file-imagem-principal");
  const previewImagemPrincipal = document.getElementById("preview-imagem-principal");
  const hiddenImagemPrincipal = document.getElementById("input-imagem-principal");

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
  // GERENCIAMENTO DE IMAGENS SECUNDÁRIAS
  // ===========================

  const fileInputSecundarias = document.getElementById('file-secundarias-emp-edit');
  const galeriaSecundarias = document.getElementById('lista-secundarias-emp-edit');

  // Função para upload no Cloudinary
  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erro no upload para Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  }

  // Função para carregar imagens existentes
  async function loadExistingImages() {
    if (!galeriaSecundarias) return;

    try {
      const response = await fetch(`/api/empreendimentos/${id}/imagens`);
      const imagens = await response.json();
      
      galeriaSecundarias.innerHTML = '';
      
      imagens.forEach(imagem => {
        const container = document.createElement('div');
        container.className = 'imagem-container';
        container.style.cssText = 'position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; margin: 5px;';
        
        // Checkbox para seleção
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'imagem-checkbox';
        checkbox.value = imagem.id;
        checkbox.style.cssText = 'margin: 0; transform: scale(1.2);';
        
        const img = document.createElement('img');
        img.src = imagem.url;
        img.className = 'thumb-secundaria';
        img.style.cssText = 'width: 100px; height: 75px; object-fit: cover; border-radius: 4px; cursor: pointer;';
        
        container.appendChild(checkbox);
        container.appendChild(img);
        galeriaSecundarias.appendChild(container);
      });
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    }
  }

  // Função para adicionar nova imagem
  async function addImageToEmpreendimento(url) {
    const response = await fetch(`/api/empreendimentos/${id}/imagens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: url, tipo: 'secundaria' })
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar imagem no banco de dados');
    }
  }

  // Função para deletar imagem
  async function deleteImage(imagemId, container) {
    if (!confirm('Deseja realmente excluir esta imagem?')) return;

    try {
      const response = await fetch(`/api/imagens_empreendimento/${imagemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        container.remove();
      } else {
        alert('Erro ao excluir imagem');
      }
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      alert('Erro ao excluir imagem');
    }
  }

  // Event listener para upload de novas imagens
  if (fileInputSecundarias) {
    fileInputSecundarias.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      
      if (files.length === 0) return;
      
      // Mostra indicador de carregamento
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = 'Fazendo upload das imagens...';
      loadingDiv.style.cssText = 'padding: 10px; background: #f0f0f0; margin: 10px 0; border-radius: 4px;';
      galeriaSecundarias.appendChild(loadingDiv);
      
      let sucessos = 0;
      let erros = 0;
      
      // Processa uploads em paralelo com Promise.allSettled
      const uploadPromises = files.map(async (file, index) => {
        try {
          const url = await uploadToCloudinary(file);
          await addImageToEmpreendimento(url);
          sucessos++;
          return { success: true, index, url };
        } catch (error) {
          console.error(`Erro no upload da imagem ${index + 1}:`, error);
          erros++;
          return { success: false, index, error: error.message };
        }
      });
      
      // Aguarda todos os uploads terminarem
      const resultados = await Promise.allSettled(uploadPromises);
      
      // Remove indicador de carregamento
      loadingDiv.remove();
      
      // Mostra resultado final
      if (sucessos > 0) {
        loadExistingImages(); // Recarrega a galeria
      }
      
      if (erros > 0) {
        alert(`Upload concluído: ${sucessos} imagem(ns) salva(s) com sucesso, ${erros} erro(s).`);
      } else {
        alert(`Todas as ${sucessos} imagens foram salvas com sucesso!`);
      }
      
      // Limpa o input
      fileInputSecundarias.value = '';
    });
  }

  // Carrega imagens existentes ao inicializar
  loadExistingImages();

  // ===========================
  // Gerenciamento de Imóveis
  // ===========================

  const btnAdicionar = document.getElementById('btn-adicionar-imovel');
  const btnRemover = document.getElementById('btn-remover-imovel');
  const selectDisponiveis = document.getElementById('imoveis-disponiveis');
  const selectSelecionados = document.getElementById('imoveis-selecionados');

  // Carrega imóveis vinculados e disponíveis
  async function carregarImoveis() {
    try {
      const response = await fetch(`/api/empreendimentos/${id}/imoveis`);
      const data = await response.json();
      
      // Limpa as listas
      selectDisponiveis.innerHTML = '';
      selectSelecionados.innerHTML = '';
      
      // Popula imóveis disponíveis
      data.disponiveis.forEach(imovel => {
        const option = document.createElement('option');
        option.value = imovel.id;
        option.textContent = `${imovel.titulo} - ${imovel.tipo} - R$ ${imovel.preco ? parseFloat(imovel.preco).toLocaleString('pt-BR') : 'N/A'}`;
        selectDisponiveis.appendChild(option);
      });
      
      // Popula imóveis vinculados
      data.vinculados.forEach(imovel => {
        const option = document.createElement('option');
        option.value = imovel.id;
        option.textContent = `${imovel.titulo} - ${imovel.tipo} - R$ ${imovel.preco ? parseFloat(imovel.preco).toLocaleString('pt-BR') : 'N/A'}`;
        selectSelecionados.appendChild(option);
      });
      
      atualizarBotoes();
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
    }
  }

  // Adiciona imóvel à seleção
  function adicionarImovel() {
    if (selectDisponiveis.selectedIndex >= 0) {
      const selectedOption = selectDisponiveis.options[selectDisponiveis.selectedIndex];
      selectSelecionados.appendChild(selectedOption);
      atualizarBotoes();
    }
  }

  // Remove imóvel da seleção
  function removerImovel() {
    if (selectSelecionados.selectedIndex >= 0) {
      const selectedOption = selectSelecionados.options[selectSelecionados.selectedIndex];
      selectDisponiveis.appendChild(selectedOption);
      atualizarBotoes();
    }
  }

  // Atualiza estado dos botões
  function atualizarBotoes() {
    btnAdicionar.disabled = selectDisponiveis.selectedIndex < 0;
    btnRemover.disabled = selectSelecionados.selectedIndex < 0;
  }

  // Obtém IDs dos imóveis selecionados
  function getImoveisSelecionados() {
    const ids = [];
    for (let i = 0; i < selectSelecionados.options.length; i++) {
      ids.push(parseInt(selectSelecionados.options[i].value));
    }
    return ids;
  }

  // Event listeners
  btnAdicionar.addEventListener('click', adicionarImovel);
  btnRemover.addEventListener('click', removerImovel);
  selectDisponiveis.addEventListener('change', atualizarBotoes);
  selectSelecionados.addEventListener('change', atualizarBotoes);

  // Carrega imóveis ao inicializar
  carregarImoveis();

  // ===========================
  // Envio dos dados do empreendimento
  // ===========================

  form.onsubmit = async function (e) {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    
    // Adiciona imóveis selecionados
    data.imoveis_selecionados = getImoveisSelecionados();

    // Conversões numéricas
    data.total_unidades = parseInt(data.total_unidades) || null;
    data.n_andares = parseInt(data.n_andares) || null;
    data.area_laje = parseFloat(data.area_laje) || null;
    data.preco_minimo = parseFloat(data.preco_minimo) || null;
    data.preco_maximo = parseFloat(data.preco_maximo) || null;
    data.area_minima = parseFloat(data.area_minima) || null;
    data.area_maxima = parseFloat(data.area_maxima) || null;
    data.quartos_minimo = parseInt(data.quartos_minimo) || null;
    data.quartos_maximo = parseInt(data.quartos_maximo) || null;
    data.vagas_minimo = parseInt(data.vagas_minimo) || null;
    data.vagas_maximo = parseInt(data.vagas_maximo) || null;
    data.iptu = parseFloat(data.iptu) || null;

    try {
      // Atualiza os dados principais via PUT
      const res = await fetch(`/api/empreendimentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Erro ao atualizar empreendimento");

      alert("Empreendimento atualizado com sucesso!");
      window.location.href = "/admin";
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o empreendimento.");
    }
  };
});

  // ===========================
  // Seleção ao clicar na imagem + destaque visual
  // ===========================
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("thumb-secundaria")) {
      const container = e.target.closest(".imagem-container");
      const checkbox = container.querySelector(".imagem-checkbox");

      // Alterna estado do checkbox
      checkbox.checked = !checkbox.checked;

      // Adiciona ou remove classe de destaque
      container.classList.toggle("selecionada", checkbox.checked);
    }
  });

  // ===========================
  // Excluir imagens secundárias selecionadas
  // ===========================
  document.getElementById("btn-excluir-secundarias-emp").onclick = async () => {
    const selecionadas = document.querySelectorAll("#lista-secundarias-emp-edit .imagem-checkbox:checked");
    if (selecionadas.length === 0) return alert("Nenhuma imagem selecionada.");

    if (!confirm("Deseja excluir as imagens selecionadas?")) return;

    for (const checkbox of selecionadas) {
      const imagemId = checkbox.value;
      try {
        await fetch(`/api/imagens_empreendimento/${imagemId}`, { method: "DELETE" });
        checkbox.closest(".imagem-container").remove();
      } catch (err) {
        console.error(err);
      }
    }
  };