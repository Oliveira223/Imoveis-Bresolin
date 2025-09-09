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
    data.preco = parseFloat(data.preco) || null;
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
        fetch(`/api/imoveis/${id}/imagens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, tipo: 'planta' })
        })
      ));

      alert("Imóvel atualizado com sucesso!");
      window.location.href = "/admin";
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o imóvel.");
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

document.getElementById("btn-excluir-secundarias").onclick = async () => {
  const selecionadas = document.querySelectorAll("#galeria-secundarias .imagem-checkbox:checked");
  if (selecionadas.length === 0) return alert("Nenhuma imagem selecionada.");

  if (!confirm("Deseja excluir as imagens selecionadas?")) return;

  for (const checkbox of selecionadas) {
    const id = checkbox.value;
    try {
      await fetch(`/api/imagens/${id}`, { method: "DELETE" });
      checkbox.closest(".imagem-container").remove();
    } catch (err) {
      console.error(err);
    }
  }
};

// ===========================
// Excluir plantas selecionadas
// ===========================

document.getElementById("btn-excluir-plantas").onclick = async () => {
  const selecionadas = document.querySelectorAll("#galeria-plantas .imagem-checkbox:checked");
  if (selecionadas.length === 0) return alert("Nenhuma planta selecionada.");

  if (!confirm("Deseja excluir as plantas selecionadas?")) return;

  for (const checkbox of selecionadas) {
    const id = checkbox.value;
    try {
      await fetch(`/api/imagens/${id}`, { method: "DELETE" });
      checkbox.closest(".imagem-container").remove();
    } catch (err) {
      console.error(err);
    }
  }
};


