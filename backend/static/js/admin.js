// ===========================
// Backup do Banco de Dados
// ===========================

const btnBackup = document.getElementById('btn-backup');
if (btnBackup) {
  btnBackup.onclick = async function () {
    const originalText = this.innerHTML;
    this.disabled = true;
    this.innerHTML = 'Gerando backup...';

    try {
      const response = await fetch('/api/admin/backup');
      if (response.ok) {
        // Obter o blob do arquivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Criar um link temporário para download
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `backup_bresolin_${timestamp}.sql`;
        document.body.appendChild(a);
        a.click();
        
        // Limpar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert("Backup concluído com sucesso!");
      } else {
        const errorData = await response.json();
        alert("Erro ao gerar backup: " + (errorData.erro || "Erro desconhecido"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor para o backup.");
    } finally {
      this.disabled = false;
      this.innerHTML = originalText;
    }
  };
}

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
  data.empreendimento_id = data.empreendimento_id || null;
  data.preco = parseFloat(data.preco) || 0;
  data.area = parseFloat(data.area) || 0;
  data.quartos = parseInt(data.quartos) || 0;
  data.vagas = parseInt(data.vagas) || 0;
  data.andar = parseInt(data.andar) || 0;
  data.suites = parseInt(data.suites) || 0;
  data.banheiros = parseInt(data.banheiros) || 0;
  data.banheiros_com_chuveiro = parseInt(data.banheiros_com_chuveiro) || 0;
  data.iptu = parseFloat(data.iptu) || 0;

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
listarEmpreendimentos(); // Substituir listarCondominios() por esta linha


// Atualizar a função de inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carregar imóveis disponíveis
    listarImoveisDisponiveis();
    
    // Adicionar event listeners para os botões de imóveis
    const btnAdicionar = document.getElementById('btn-adicionar-imovel');
    const btnRemover = document.getElementById('btn-remover-imovel');
    const disponiveis = document.getElementById('imoveis-disponiveis');
    const selecionados = document.getElementById('imoveis-selecionados');
    
    if (btnAdicionar) {
        btnAdicionar.addEventListener('click', adicionarImovel);
    }
    
    if (btnRemover) {
        btnRemover.addEventListener('click', removerImovel);
    }
    
    // Event listeners para atualizar botões quando seleção muda
    if (disponiveis) {
        disponiveis.addEventListener('change', atualizarBotoesImoveis);
    }
    
    if (selecionados) {
        selecionados.addEventListener('change', atualizarBotoesImoveis);
    }
    
    // Inicializar estado dos botões
    atualizarBotoesImoveis();
});

// Função para listar imóveis disponíveis
function listarImoveisDisponiveis() {
    fetch('/api/imoveis')
        .then(response => response.json())
        .then(data => {
            console.log('Total de imóveis encontrados:', data.length);
            console.log('Dados dos imóveis:', data);
            
            const select = document.getElementById('imoveis-disponiveis');
            if (select) {
                select.innerHTML = '';
                
                let imoveisDisponiveis = 0;
                data.forEach(imovel => {
                    console.log(`Imóvel ${imovel.id}: empreendimento_id = ${imovel.empreendimento_id}`);
                    
                    // Só adiciona imóveis que não têm empreendimento vinculado
                    if (!imovel.empreendimento_id) {
                        const option = document.createElement('option');
                        option.value = imovel.id;
                        option.textContent = `${imovel.titulo} - ${imovel.tipo} - R$ ${imovel.preco ? parseFloat(imovel.preco).toLocaleString('pt-BR') : 'N/A'}`;
                        select.appendChild(option);
                        imoveisDisponiveis++;
                    }
                });
                
                console.log('Imóveis disponíveis (sem empreendimento):', imoveisDisponiveis);
                
                if (imoveisDisponiveis === 0) {
                    const option = document.createElement('option');
                    option.textContent = 'Nenhum imóvel disponível';
                    option.disabled = true;
                    select.appendChild(option);
                }
            }
        })
        .catch(error => {
            console.error('Erro ao carregar imóveis:', error);
        });
}

// Função para mover imóveis da lista disponível para selecionados
function adicionarImovel() {
    const disponiveis = document.getElementById('imoveis-disponiveis');
    const selecionados = document.getElementById('imoveis-selecionados');
    
    if (disponiveis && selecionados && disponiveis.selectedIndex >= 0) {
        const selectedOption = disponiveis.options[disponiveis.selectedIndex];
        selecionados.appendChild(selectedOption);
        
        // Atualizar estado dos botões
        atualizarBotoesImoveis();
    }
}

// Função para mover imóveis da lista selecionados para disponível
function removerImovel() {
    const disponiveis = document.getElementById('imoveis-disponiveis');
    const selecionados = document.getElementById('imoveis-selecionados');
    
    if (disponiveis && selecionados && selecionados.selectedIndex >= 0) {
        const selectedOption = selecionados.options[selecionados.selectedIndex];
        disponiveis.appendChild(selectedOption);
        
        // Atualizar estado dos botões
        atualizarBotoesImoveis();
    }
}

// Função para atualizar estado dos botões
function atualizarBotoesImoveis() {
    const disponiveis = document.getElementById('imoveis-disponiveis');
    const selecionados = document.getElementById('imoveis-selecionados');
    const btnAdicionar = document.getElementById('btn-adicionar-imovel');
    const btnRemover = document.getElementById('btn-remover-imovel');
    
    if (btnAdicionar) {
        btnAdicionar.disabled = !disponiveis || disponiveis.selectedIndex < 0;
    }
    
    if (btnRemover) {
        btnRemover.disabled = !selecionados || selecionados.selectedIndex < 0;
    }
}

// Função para obter IDs dos imóveis selecionados
function getImoveisSelecionados() {
    const selecionados = document.getElementById('imoveis-selecionados');
    const ids = [];
    
    if (selecionados) {
        for (let i = 0; i < selecionados.options.length; i++) {
            ids.push(parseInt(selecionados.options[i].value));
        }
    }
    
    return ids;
}

// Atualizar a função cadastrarEmpreendimento
function cadastrarEmpreendimento(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    // Adicionar imóveis selecionados
    data.imoveis_selecionados = getImoveisSelecionados();
    
    fetch('/api/empreendimentos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Empreendimento cadastrado com sucesso!');
            event.target.reset();
            // Limpar listas de imóveis
            document.getElementById('imoveis-selecionados').innerHTML = '';
            // Recarregar lista de imóveis disponíveis
            listarImoveisDisponiveis();
            listarEmpreendimentos();
        } else {
            alert('Erro ao cadastrar empreendimento: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao cadastrar empreendimento');
    });
}

// ===========================
// Gestão de Corretores
// ===========================

const formNovoCorretor = document.getElementById('form-novo-corretor');
const listaCorretores = document.getElementById('lista-corretores');

if (formNovoCorretor) {
    listarCorretores();

    formNovoCorretor.onsubmit = async function(e) {
        e.preventDefault();
        const nome = document.getElementById('novo-corretor-nome').value;
        const senha = document.getElementById('novo-corretor-senha').value;

        try {
            const res = await fetch('/api/corretores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, senha })
            });

            if (res.ok) {
                alert('Corretor adicionado com sucesso!');
                formNovoCorretor.reset();
                listarCorretores();
            } else {
                const data = await res.json();
                alert('Erro: ' + (data.erro || 'Erro desconhecido'));
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao conectar com o servidor.');
        }
    };
}

function listarCorretores() {
    fetch('/api/corretores')
        .then(r => r.json())
        .then(corretores => {
            listaCorretores.innerHTML = '';
            corretores.forEach(c => {
                const dataCriacao = new Date(c.data_criacao).toLocaleDateString('pt-BR');
                listaCorretores.innerHTML += `
                    <tr>
                        <td style="padding: 10px;">${c.nome}</td>
                        <td style="padding: 10px;">${c.ativo ? 'Ativo' : 'Inativo'}</td>
                        <td style="padding: 10px;">
                            <button onclick="editarSenhaCorretor(${c.id})" class="btn-editar" style="padding: 5px 10px; margin-right: 5px;">Senha</button>
                            <button onclick="excluirCorretor(${c.id})" class="btn-excluir" style="padding: 5px 10px;">Excluir</button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error('Erro ao listar corretores:', err));
}

function excluirCorretor(id) {
    if (!confirm('Tem certeza que deseja excluir este corretor?')) return;
    
    fetch(`/api/corretores/${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) {
                listarCorretores();
            } else {
                alert('Erro ao excluir corretor.');
            }
        })
        .catch(err => console.error(err));
}

// ===========================
// Gerador de Link Personalizado
// ===========================

const selectImovelLink = document.getElementById('select-imovel-link');
const btnGerarLink = document.getElementById('btn-gerar-link');
const containerLinkGerado = document.getElementById('container-link-gerado');
const inputLinkGerado = document.getElementById('link-gerado');
const btnCopiarLink = document.getElementById('btn-copiar-link');

if (selectImovelLink) {
    // Carregar imóveis para o select
    fetch('/api/imoveis')
        .then(r => r.json())
        .then(imoveis => {
            selectImovelLink.innerHTML = '<option value="">Selecione um imóvel...</option>';
            imoveis.forEach(imovel => {
                const option = document.createElement('option');
                option.value = imovel.id;
                option.textContent = `ID ${imovel.id} - ${imovel.titulo}`;
                selectImovelLink.appendChild(option);
            });
        });

    btnGerarLink.onclick = function() {
        const id = selectImovelLink.value;
        if (!id) {
            alert('Selecione um imóvel primeiro.');
            return;
        }
        
        const link = `${window.location.origin}/cadastro/${id}`;
        inputLinkGerado.value = link;
        containerLinkGerado.style.display = 'block';
    };

    btnCopiarLink.onclick = function() {
        inputLinkGerado.select();
        document.execCommand('copy');
        alert('Link copiado!');
    };
}

function editarSenhaCorretor(id) {
    const novaSenha = prompt("Digite a nova senha para este corretor:");
    if (novaSenha === null) return; // Cancelou
    
    if (!novaSenha.trim()) {
        alert("A senha não pode ser vazia.");
        return;
    }
    
    fetch(`/api/corretores/${id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: novaSenha })
    })
    .then(res => {
        if (res.ok) {
            alert("Senha alterada com sucesso!");
        } else {
            alert("Erro ao alterar senha.");
        }
    })
    .catch(err => console.error(err));
}
