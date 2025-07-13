// ===========================
// Habilita o campo de entrega conforme estágio da obra
// ===========================

document.getElementById('estagio-select').onchange = function () {
  document.getElementById('entrega-input').disabled = this.value !== 'EM CONSTRUÇÃO';
};

// ===========================
// Upload de imagem principal via Cloudinary
// ===========================

document.getElementById('file-imagem').onchange = async function () {
  const file = this.files[0];
  const preview = document.getElementById('preview-imagem');

  if (!file) {
    preview.style.display = 'none';
    return;
  }

  // Mostrar preview da imagem local
  const reader = new FileReader();
  reader.onload = function (e) {
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);

  // Enviar para Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'bresolin');

  const cloudName = 'dexpbb2dd';

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  document.getElementById('input-imagem').value = data.secure_url;
};

// ===========================
// Armazenamento temporário das imagens secundárias
// ===========================

const imagensSecundariasTemp = [];

// ===========================
// Upload de imagens secundárias (Cloudinary)
// ===========================

document.getElementById('file-secundarias').onchange = function () {
  const files = Array.from(this.files);
  const galeria = document.getElementById('lista-secundarias');
  galeria.innerHTML = '';
  imagensSecundariasTemp.length = 0;

  const limitePreview = 4;
  const cloudName = 'dexpbb2dd';

  files.forEach(async (file, index) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'bresolin');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    imagensSecundariasTemp.push(data.secure_url);

    // Mostrar preview das primeiras
    if (index < limitePreview) {
      const img = document.createElement('img');
      img.src = data.secure_url;
      galeria.appendChild(img);
    }

    if (index === limitePreview - 1 && files.length > limitePreview) {
      const restante = files.length - limitePreview;
      const span = document.createElement('div');
      span.className = 'preview-contador';
      span.textContent = `+ ${restante} foto${restante > 1 ? 's' : ''}`;
      galeria.appendChild(span);
    }
  });
};

// ===========================
// Cadastro de Condomínio
// ===========================

document.getElementById('form-condominio').onsubmit = function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  fetch('/api/condominios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(() => {
    this.reset();
    listarCondominios();
  });
};

// ===========================
// Cadastro de Imóvel
// ===========================

document.getElementById('form-imovel').onsubmit = async function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));

  if (!data.titulo) {
    alert("O título do imóvel é obrigatório.");
    return;
  }

  data.ativo = this.ativo.checked;
  data.condominio_id = data.condominio_id || null;
  data.preco = parseFloat(data.preco) || 0;
  data.area = parseFloat(data.area) || 0;
  data.quartos = parseInt(data.quartos) || 0;
  data.suites = parseInt(data.suites) || 0;
  data.banheiros = parseInt(data.banheiros) || 0;
  data.vagas = parseInt(data.vagas) || 0;
  data.andar = parseInt(data.andar) || 0;

  try {
    const res = await fetch('/api/imoveis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Erro ao cadastrar imóvel');

    const lista = await fetch('/api/imoveis').then(r => r.json());
    const novoImovel = lista.sort((a, b) => b.id - a.id)[0];

    // Enviar imagens secundárias
    await Promise.all(imagensSecundariasTemp.map(url =>
      fetch(`/api/imoveis/${novoImovel.id}/imagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tipo: 'secundaria' })
      })
    ));

    alert("Imóvel cadastrado com sucesso!");
    this.reset();
    document.getElementById('lista-secundarias').innerHTML = '';
    imagensSecundariasTemp.length = 0;
    listarImoveis();

  } catch (err) {
    console.error(err);
    alert("Ocorreu um erro ao cadastrar o imóvel.");
  }
};

// ===========================
// Listagem e Ações
// ===========================

function listarImoveis() {
  fetch('/api/imoveis')
    .then(r => r.json())
    .then(imoveis => {
      const lista = document.getElementById('lista-admin');
      lista.innerHTML = '';
      imoveis.forEach(imovel => {
        const imagemHtml = imovel.imagem
          ? `<img src="${imovel.imagem}" alt="${imovel.titulo}" class="img-miniatura">`
          : `<div class="img-miniatura img-placeholder">Sem imagem</div>`;

        lista.innerHTML += `
          <div class="imovel-admin">
            ${imagemHtml}
            <b>${imovel.titulo}</b> (ID ${imovel.id})<br>
            ${imovel.ativo ? 'Ativo' : 'Inativo'}<br><br>

            <button class="btn-editar" onclick="editarImovel(${imovel.id})">Editar</button>
            <button class="btn-toggle" onclick="alternarAtivo(${imovel.id})">
              ${imovel.ativo ? 'Desativar' : 'Ativar'}
            </button>
            <button class="btn-excluir" onclick="removerImovel(${imovel.id})">Excluir</button>
          </div>
        `;
      });
    });
}

function listarCondominios() {
  fetch('/api/condominios')
    .then(r => r.json())
    .then(condos => {
      const select = document.getElementById('condominio-select');
      select.innerHTML = '<option value="">Sem condomínio</option>';
      condos.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.nome} (ID ${c.id})`;
        select.appendChild(opt);
      });
    });
}

function removerImovel(id) {
  if (!confirm("Tem certeza que deseja excluir este imóvel?")) return;
  fetch(`/api/imoveis/${id}`, { method: 'DELETE' })
    .then(() => listarImoveis());
}

function alternarAtivo(id) {
  fetch(`/api/imoveis/${id}/toggle`, { method: 'POST' })
    .then(() => listarImoveis());
}

function editarImovel(id) {
  alert("Funcionalidade de edição ainda não implementada.");
}

listarImoveis();
listarCondominios();
