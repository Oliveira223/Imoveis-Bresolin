// ===========================
// Habilita campo de entrega conforme estágio do imóvel
// ===========================

document.getElementById('estagio-imovel-select').onchange = function () {
  document.getElementById('entrega-imovel-input').disabled = this.value !== 'EM CONSTRUÇÃO';
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

  // Preview local
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
// Upload de imagens secundárias (Cloudinary)
// ===========================

const imagensSecundariasTemp = [];

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
// Envio de plantas
// ===========================

const plantasTemp = [];

document.getElementById('file-plantas').onchange = function () {
  const files = Array.from(this.files);
  const galeria = document.getElementById('lista-plantas');
  galeria.innerHTML = '';
  plantasTemp.length = 0;

  const limitePreview = 4;
  const cloudName = 'dexpbb2dd';

  files.forEach(async (file, index) => {
    if (!file) return;

    // Upload para Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'bresolin');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    plantasTemp.push(data.secure_url);

    // Preview das imagens
    if (index < limitePreview) {
      const img = document.createElement('img');
      img.src = data.secure_url;
      galeria.appendChild(img);
    }

    // Mostrar contador de imagens extras
    if (index === limitePreview - 1 && files.length > limitePreview) {
      const restante = files.length - limitePreview;
      const span = document.createElement('div');
      span.className = 'preview-contador';
      span.textContent = `+ ${restante} planta${restante > 1 ? 's' : ''}`;
      galeria.appendChild(span);
    }
  });
};


// ===========================
// Cadastro de Imóvel
// ===========================

document.getElementById('form-imovel').onsubmit = async function (e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));

  // Validação mínima
  if (!data.tipo) {
    alert("O tipo do imóvel é obrigatório.");
    return;
  }

  // Conversões e tratamentos
  data.ativo = this.ativo.checked;
  data.condominio_id = data.condominio_id || null;
  data.preco = parseFloat(data.preco) || 0;
  data.area = parseFloat(data.area) || 0;
  data.quartos = parseInt(data.quartos) || 0;
  data.vagas = parseInt(data.vagas) || 0;
  data.andar = parseInt(data.andar) || 0;
  data.suites = parseInt(data.suites) || 0;
  data.banheiros = parseInt(data.banheiros) || 0;
  data.banheiros_com_chuveiro = parseInt(data.banheiros_com_chuveiro) || 0;
  data.iptu = parseFloat(data.iptu) || 0;
  data.valor_condominio = parseFloat(data.valor_condominio) || 0;

  data.piscina = this.piscina?.checked || false;
  data.churrasqueira = this.churrasqueira?.checked || false;

  // Forçar campos que podem estar desabilitados ou ausentes
  data.entrega = document.getElementById('entrega-imovel-input').value || null;
  data.imagem = data.imagem?.trim() || "";

  // Campos opcionais de texto
  data.estagio = data.estagio || null;
  data.campo_extra1 = data.campo_extra1 || null;
  data.campo_extra2 = data.campo_extra2 || null;
  data.link = data.link || null;

  try {
    // Enviar imóvel principal
    const res = await fetch('/api/imoveis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Erro ao cadastrar imóvel');

    // Obter o último imóvel cadastrado
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


    //enviar plantas
    await Promise.all(plantasTemp.map(url =>
      fetch(`/api/imoveis/${novoImovel.id}/imagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tipo: 'planta' })
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
// Listar imóveis
// ===========================

function listarImoveis() {
  fetch('/api/imoveis')
    .then(r => r.json())
    .then(imoveis => {
      const lista = document.getElementById('lista-admin');
      lista.innerHTML = '';
      imoveis.forEach(imovel => {
        const imagemEhValida = imovel.imagem && imovel.imagem.trim() !== "";

        const imagemHtml = imagemEhValida
          ? `<img src="${imovel.imagem}" alt="${imovel.titulo}" class="img-miniatura">`
          : `<img src="/static/img/casa.png" alt="Imagem padrão" class="img-miniatura">`;

        lista.innerHTML += `
          <div class="imovel-admin">
            ${imagemHtml}
            <b>${imovel.titulo}</b> (ID ${imovel.id})<br>
            ${imovel.ativo ? 'Ativo' : 'Inativo'}<br><br>

            <button class="btn-editar" onclick="editarImovel(${imovel.id})">Editar</button>
            <button class="btn-toggle" onclick="alternarAtivo(${imovel.id})">${imovel.ativo ? 'Desativar' : 'Ativar'}</button>
            <button class="btn-excluir" onclick="removerImovel(${imovel.id})">Excluir</button>

          </div>
        `;
      });
    });
}

// ===========================
// Listar condomínios
// ===========================

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

// ===========================
// Alternar visibilidade
// ===========================

function alternarAtivo(id) {
  fetch(`/api/imoveis/${id}/toggle`, { method: 'POST' })
    .then(() => listarImoveis());
}

// ===========================
// Remover imóvel
// ===========================

function removerImovel(id) {
  if (!confirm("Tem certeza que deseja excluir este imóvel?")) return;
  fetch(`/api/imoveis/${id}`, { method: 'DELETE' })
    .then(() => listarImoveis());
}

// ===========================
// Placeholder para edição
// ===========================

function editarImovel(id) {
  window.location.href = `/admin/imovel/${id}/editar`;
}

// ===========================
// Campo Preço com R$ e formatação
// ===========================
function configurarCampoMonetario(idEditavel, idReal) {
  const editavel = document.getElementById(idEditavel);
  const real = document.getElementById(idReal);

  editavel.addEventListener('input', function () {
    // Remove caracteres não numéricos e ",00"
    let texto = this.innerText.replace(',00', '').replace(/\D/g, '');

    if (texto) {
      const formatado = parseInt(texto).toLocaleString('pt-BR') + ',00';
      this.innerText = formatado;
      real.value = texto;

      // Reposiciona o cursor corretamente
      reposicionarCursorAntesDaVirgula(this);
    } else {
      this.innerText = '';
      real.value = '';
    }
  });

  // Impede quebra de linha com Enter
  editavel.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') e.preventDefault();
  });
}

// ===========================
// Reposicionar cursor antes da vírgula
// ===========================
function reposicionarCursorAntesDaVirgula(el) {
  const range = document.createRange();
  const sel = window.getSelection();
  const node = el.firstChild;
  if (!node) return;

  // Localiza a vírgula ou, se não existir, vai para o final
  const index = node.textContent.indexOf(',') > -1 ? node.textContent.indexOf(',') : node.textContent.length;

  range.setStart(node, index);
  range.setEnd(node, index);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Inicializa os campos monetários
configurarCampoMonetario('preco-editavel-admin', 'preco-admin-real');
configurarCampoMonetario('iptu-editavel-admin', 'iptu-admin-real');
configurarCampoMonetario('condominio-editavel-admin', 'condominio-admin-real');


// ===========================
// Inicialização
// ===========================

listarImoveis();
listarCondominios();
