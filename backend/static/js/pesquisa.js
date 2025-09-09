// document.addEventListener('DOMContentLoaded', () => {
//   // ================================
//   // Tela de carregamento
//   // ================================
//   const paths = [
//     document.getElementById("path-1"),
//     document.getElementById("path-2"),
//   ];

//   const loader = document.querySelector(".loading-container");
//   const DURATION = 800;

//   paths.forEach((path, index) => {
//     const length = path.getTotalLength();
//     path.style.strokeDasharray = length;
//     path.style.strokeDashoffset = length;

//     setTimeout(() => {
//       path.style.transition = `stroke-dashoffset ${DURATION}ms ease-out`;
//       path.style.strokeDashoffset = "0";
//     }, index * DURATION);
//   });

//   setTimeout(() => {
//     loader.style.opacity = "0";
//     setTimeout(() => loader.remove(), 600);
//   }, paths.length * DURATION + 200);

//   // ================================
//   // Preço editável formatado
//   // ================================
//   const precoEditavel = document.getElementById('preco-editavel');
//   const precoReal = document.getElementById('max_preco_real');

//   precoEditavel.addEventListener('input', function () {
//     let texto = this.innerText.replace(',00', '').replace(/\D/g, '');

//     if (texto) {
//       let formatado = parseInt(texto).toLocaleString('pt-BR') + ',00';
//       this.innerText = formatado;
//       precoReal.value = texto;
//       placeCaretBeforeComma(this);
//     } else {
//       this.innerText = '';
//       precoReal.value = '';
//     }
//   });

//   precoEditavel.addEventListener('keydown', function (e) {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       document.querySelector('form').requestSubmit();
//     }
//   });

//   function placeCaretBeforeComma(el) {
//     const range = document.createRange();
//     const sel = window.getSelection();
//     const node = el.firstChild;
//     if (!node) return;
//     const index = node.textContent.indexOf(',');
//     range.setStart(node, index);
//     range.setEnd(node, index);
//     sel.removeAllRanges();
//     sel.addRange(range);
//   }

//   document.querySelector('form').addEventListener('submit', function () {
//     let texto = precoEditavel.innerText.replace(',00', '').replace(/\D/g, '');
//     precoReal.value = texto || '';
//   });

//   // ================================
//   // Habilitar/desabilitar campo entrega
//   // ================================
//   const estagioSelect = document.getElementById('estagio');
//   const entregaInput = document.getElementById('entrega');

//   if (entregaInput && estagioSelect) {
//     function atualizarCampoEntrega() {
//       entregaInput.disabled = estagioSelect.value !== 'EM CONSTRUÇÃO';
//     }

//     estagioSelect.addEventListener('change', atualizarCampoEntrega);
//     atualizarCampoEntrega(); // ao carregar a página
//   }

//   // ================================
//   // Botão "Filtrar Imóveis" no mobile
//   // ================================
//   const btnToggle = document.getElementById('btn-toggle-filtros');
//   const filtros = document.querySelector('.filtros');

//   if (btnToggle && filtros) {
//     btnToggle.addEventListener('click', () => {
//       filtros.classList.toggle('ativo');
//       btnToggle.textContent = filtros.classList.contains('ativo')
//         ? 'Fechar Filtros ▲'
//         : 'Filtrar Imóveis ▼';
//     });
//   }

//   // ================================
//   // Pesquisa rápida em tempo real
//   // ================================
  
//   // Elementos mobile
//   const termoInputMobile = document.getElementById('termo-pesquisa');
//   const sugestoesBoxMobile = document.getElementById('sugestoes-pesquisa');
//   const btnLimparMobile = document.getElementById('limpar-pesquisa');
  
//   // Elementos desktop
//   const termoInputDesktop = document.getElementById('termo-pesquisa-desktop');
//   const sugestoesBoxDesktop = document.getElementById('sugestoes-pesquisa-desktop');
//   const btnLimparDesktop = document.getElementById('limpar-pesquisa-desktop');
  
//   const contadorImoveis = document.querySelector('.contador-imoveis');

//   // Função para configurar eventos de pesquisa
//   function configurarPesquisa(termoInput, sugestoesBox, btnLimpar) {
//     if (!termoInput || !sugestoesBox) return;
    
//     termoInput.addEventListener("input", () => {
//       const query = termoInput.value.trim();

//       // Sincronizar com o outro input
//       const outroInput = termoInput === termoInputMobile ? termoInputDesktop : termoInputMobile;
//       if (outroInput) outroInput.value = query;

//       // Filtrar imóveis em tempo real
//       filtrarImoveis();

//       // Mostrar sugestões se tiver mais de 2 caracteres
//       if (query.length < 2) {
//         sugestoesBox.style.display = "none";
//         return;
//       }

//       fetch(`/api/sugestoes?query=${encodeURIComponent(query)}`)
//         .then(res => res.json())
//         .then(data => {
//           sugestoesBox.innerHTML = "";
//           if (data.length === 0) {
//             sugestoesBox.style.display = "none";
//             return;
//           }
//           data.forEach(item => {
//             const div = document.createElement("div");
//             div.textContent = item;
//             div.addEventListener("click", () => {
//               termoInput.value = item;
//               // Sincronizar com o outro input
//               if (outroInput) outroInput.value = item;
//               sugestoesBox.style.display = "none";
//               filtrarImoveis();
//             });
//             sugestoesBox.appendChild(div);
//           });
//           sugestoesBox.style.display = "block";
//         });
//     });

//     // Event listener para botão limpar
//     if (btnLimpar) {
//       btnLimpar.addEventListener('click', () => {
//         termoInput.value = '';
//         // Sincronizar com o outro input
//         const outroInput = termoInput === termoInputMobile ? termoInputDesktop : termoInputMobile;
//         if (outroInput) outroInput.value = '';
//         sugestoesBox.style.display = 'none';
//         filtrarImoveis();
//       });
//     }
//   }

//   // Configurar pesquisa para mobile e desktop
//   configurarPesquisa(termoInputMobile, sugestoesBoxMobile, btnLimparMobile);
//   configurarPesquisa(termoInputDesktop, sugestoesBoxDesktop, btnLimparDesktop);

//   // Fechar sugestões ao clicar fora
//   document.addEventListener("click", (e) => {
//     if (sugestoesBoxMobile && !sugestoesBoxMobile.contains(e.target) && e.target !== termoInputMobile) {
//       sugestoesBoxMobile.style.display = "none";
//     }
//     if (sugestoesBoxDesktop && !sugestoesBoxDesktop.contains(e.target) && e.target !== termoInputDesktop) {
//       sugestoesBoxDesktop.style.display = "none";
//     }
//   });

//   function filtrarImoveis() {
//     // Pegar o valor de qualquer um dos inputs (eles devem estar sincronizados)
//     const termo = (termoInputMobile?.value || termoInputDesktop?.value || '').toLowerCase().trim();
//     const cards = document.querySelectorAll('.card-link');
//     let visiveisCount = 0;
//     let empreendimentosVisiveis = 0;
//     let imoveisVisiveis = 0;

//     cards.forEach(card => {
//       let textoCard = '';
      
//       // Para imóveis, incluir dados específicos incluindo o título
//       if (!card.classList.contains('card-empreendimento-link')) {
//         // Pegar o título do imóvel do atributo alt da imagem
//         const imagem = card.querySelector('.card-imagem img');
//         const titulo = imagem ? imagem.getAttribute('alt') || '' : '';
        
//         // Pegar outros dados específicos dos imóveis
//         const tipo = card.querySelector('.card-info_principal h1')?.textContent || '';
//         const id = card.querySelector('.card-info_principal h2')?.textContent || '';
//         const pretensao = card.querySelector('.pretensao')?.textContent || '';
//         const bairro = card.querySelector('.bairro')?.textContent || '';
//         const cidade = card.querySelector('.cidade')?.textContent || '';
//         const preco = card.querySelector('.card-preco p')?.textContent || '';
        
//         // Combinar todos os dados para busca, incluindo o título
//         textoCard = `${titulo} ${tipo} ${id} ${pretensao} ${bairro} ${cidade} ${preco}`.toLowerCase();
//       } else {
//         // Para empreendimentos, usar todo o texto visível
//         textoCard = card.textContent.toLowerCase();
//       }
      
//       const isVisible = !termo || textoCard.includes(termo);

//       if (isVisible) {
//         card.style.display = 'block';
//         visiveisCount++;
        
//         // Contar por tipo
//         if (card.classList.contains('card-empreendimento-link')) {
//           empreendimentosVisiveis++;
//         } else {
//           imoveisVisiveis++;
//         }
//       } else {
//         card.style.display = 'none';
//       }
//     });

//     // Atualizar contador
//     atualizarContador(visiveisCount, empreendimentosVisiveis, imoveisVisiveis);

//     // Mostrar/esconder mensagem de "nenhum resultado"
//     const nenhumEncontrado = document.querySelector('.nenhum-encontrado');
//     if (nenhumEncontrado) {
//       nenhumEncontrado.style.display = visiveisCount === 0 ? 'block' : 'none';
//     }
//   }

//   function atualizarContador(total, empreendimentos, imoveis) {
//     let texto = `${total} ${total > 1 ? 'resultados' : 'resultado'} ${total > 1 ? 'encontrados' : 'encontrado'}`;
    
//     if (empreendimentos > 0 && imoveis > 0) {
//       texto += ` (${empreendimentos} ${empreendimentos > 1 ? 'empreendimentos' : 'empreendimento'} e ${imoveis} ${imoveis > 1 ? 'imóveis' : 'imóvel'})`;
//     } else if (empreendimentos > 0) {
//       texto += ` (${empreendimentos} ${empreendimentos > 1 ? 'empreendimentos' : 'empreendimento'})`;
//     } else if (imoveis > 0) {
//       texto += ` (${imoveis} ${imoveis > 1 ? 'imóveis' : 'imóvel'})`;
//     }
    
//     // Atualizar TODOS os contadores (mobile e desktop)
//     const contadores = document.querySelectorAll('.contador-imoveis');
//     contadores.forEach(contador => {
//       contador.textContent = texto;
//     });
//   }
// });

document.addEventListener('DOMContentLoaded', () => {
  // ================================
  // Tela de carregamento
  // ================================
  const paths = [
    document.getElementById("path-1"),
    document.getElementById("path-2"),
  ];

  const loader = document.querySelector(".loading-container");
  const DURATION = 800;

  paths.forEach((path, index) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    setTimeout(() => {
      path.style.transition = `stroke-dashoffset ${DURATION}ms ease-out`;
      path.style.strokeDashoffset = "0";
    }, index * DURATION);
  });

  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 600);
  }, paths.length * DURATION + 200);

  // ================================
  // Elementos globais
  // ================================
  const precoEditavel = document.getElementById('preco-editavel');
  const precoReal = document.getElementById('max_preco_real');
  
  // Elementos mobile
  const termoInputMobile = document.getElementById('termo-pesquisa');
  const sugestoesBoxMobile = document.getElementById('sugestoes-pesquisa');
  const btnLimparMobile = document.getElementById('limpar-pesquisa');
  
  // Elementos desktop
  const termoInputDesktop = document.getElementById('termo-pesquisa-desktop');
  const sugestoesBoxDesktop = document.getElementById('sugestoes-pesquisa-desktop');
  const btnLimparDesktop = document.getElementById('limpar-pesquisa-desktop');
  
  // Elementos do formulário de filtros
  const tipoSelect = document.getElementById('tipo');
  const localizacaoInput = document.getElementById('localizacao');
  const areaMinInput = document.getElementById('area_min');
  const areaMaxInput = document.getElementById('area_max');
  const quartosInput = document.getElementById('quartos');
  const banheirosInput = document.getElementById('banheiros');
  const vagasInput = document.getElementById('vagas');
  const piscinaCheckbox = document.querySelector('input[name="piscina"]');
  const churrasqueiraCheckbox = document.querySelector('input[name="churrasqueira"]');

  // ================================
  // Função para posicionar cursor no preço
  // ================================
  function placeCaretBeforeComma(el) {
    const range = document.createRange();
    const sel = window.getSelection();
    const node = el.firstChild;
    if (!node) return;
    const index = node.textContent.indexOf(',');
    range.setStart(node, index);
    range.setEnd(node, index);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // ================================
  // Função para atualizar contador
  // ================================
  function atualizarContador(total, empreendimentos, imoveis) {
    let texto = `${total} ${total > 1 ? 'resultados' : 'resultado'} ${total > 1 ? 'encontrados' : 'encontrado'}`;
    
    if (empreendimentos > 0 && imoveis > 0) {
      texto += ` (${empreendimentos} ${empreendimentos > 1 ? 'empreendimentos' : 'empreendimento'} e ${imoveis} ${imoveis > 1 ? 'imóveis' : 'imóvel'})`;
    } else if (empreendimentos > 0) {
      texto += ` (${empreendimentos} ${empreendimentos > 1 ? 'empreendimentos' : 'empreendimento'})`;
    } else if (imoveis > 0) {
      texto += ` (${imoveis} ${imoveis > 1 ? 'imóveis' : 'imóvel'})`;
    }
    
    // Atualizar TODOS os contadores (mobile e desktop)
    const contadores = document.querySelectorAll('.contador-imoveis');
    contadores.forEach(contador => {
      contador.textContent = texto;
    });
  }

  // ================================
  // Função principal de filtragem
  // ================================
  function aplicarFiltrosCompletos() {
    const cards = document.querySelectorAll('.card-link');
    let visiveisCount = 0;
    let empreendimentosVisiveis = 0;
    let imoveisVisiveis = 0;
  
    // Obter valores dos filtros
    const filtros = {
      termo: (termoInputMobile?.value || termoInputDesktop?.value || '').toLowerCase().trim(),
      tipo: tipoSelect?.value || '',
      localizacao: localizacaoInput?.value.toLowerCase().trim() || '',
      precoMax: precoReal?.value ? parseInt(precoReal.value) : null,
      areaMin: areaMinInput?.value ? parseInt(areaMinInput.value) : null,
      areaMax: areaMaxInput?.value ? parseInt(areaMaxInput.value) : null,
      quartos: quartosInput?.value ? parseInt(quartosInput.value) : null,
      banheiros: banheirosInput?.value ? parseInt(banheirosInput.value) : null,
      vagas: vagasInput?.value ? parseInt(vagasInput.value) : null,
      piscina: piscinaCheckbox?.checked || false,
      churrasqueira: churrasqueiraCheckbox?.checked || false
    };
  
    cards.forEach(card => {
      let isVisible = true;
      const isEmpreendimento = card.classList.contains('card-empreendimento-link');
      
      // Filtro por termo de pesquisa
      if (filtros.termo) {
        let textoCard = '';
        
        if (!isEmpreendimento) {
          const imagem = card.querySelector('.card-imagem img');
          const titulo = imagem ? imagem.getAttribute('alt') || '' : '';
          const tipo = card.querySelector('.card-info_principal h1')?.textContent || '';
          const id = card.querySelector('.card-info_principal h2')?.textContent || '';
          const pretensao = card.querySelector('.pretensao')?.textContent || '';
          const bairro = card.querySelector('.bairro')?.textContent || '';
          const cidade = card.querySelector('.cidade')?.textContent || '';
          const preco = card.querySelector('.card-preco p')?.textContent || '';
          
          textoCard = `${titulo} ${tipo} ${id} ${pretensao} ${bairro} ${cidade} ${preco}`.toLowerCase();
        } else {
          textoCard = card.textContent.toLowerCase();
        }
        
        if (!textoCard.includes(filtros.termo)) {
          isVisible = false;
        }
      }
  
      // Filtro por tipo
      if (isVisible && filtros.tipo) {
        if (filtros.tipo === 'empreendimento') {
          if (!isEmpreendimento) {
            isVisible = false;
          }
        } else {
          if (isEmpreendimento) {
            isVisible = false;
          } else {
            const tipoImovel = card.querySelector('.card-info_principal h1')?.textContent.toLowerCase() || '';
            if (!tipoImovel.includes(filtros.tipo.toLowerCase())) {
              isVisible = false;
            }
          }
        }
      }
  
      // Filtro por localização (aplicar para ambos: imóveis e empreendimentos)
      if (isVisible && filtros.localizacao) {
        const bairro = card.querySelector('.bairro')?.textContent.toLowerCase() || '';
        const cidade = card.querySelector('.cidade')?.textContent.toLowerCase() || '';
        const localizacaoCard = `${bairro} ${cidade}`;
        
        if (!localizacaoCard.includes(filtros.localizacao)) {
          isVisible = false;
        }
      }
  
      // Filtro por preço máximo (corrigir conversão de preço)
      if (isVisible && filtros.precoMax) {
        const precoTexto = card.querySelector('.card-preco p')?.textContent || '';
        // Remover 'R$', espaços, pontos e vírgulas, depois converter
        const precoLimpo = precoTexto.replace(/[R$\s\.]/g, '').replace(',', '.');
        const precoNumero = parseFloat(precoLimpo);
        
        if (precoNumero && precoNumero > filtros.precoMax) {
          isVisible = false;
        }
      }
  
      // Filtros específicos para imóveis (não empreendimentos)
      if (isVisible && !isEmpreendimento) {
        // Área mínima e máxima
        if (filtros.areaMin || filtros.areaMax) {
          const areaElement = card.querySelector('.info-item img[alt="Área"]');
          if (areaElement) {
            const areaTexto = areaElement.parentElement.querySelector('span')?.textContent || '';
            const areaNumero = parseInt(areaTexto.replace(/\D/g, ''));
            
            if (filtros.areaMin && (!areaNumero || areaNumero < filtros.areaMin)) {
              isVisible = false;
            }
            if (filtros.areaMax && areaNumero && areaNumero > filtros.areaMax) {
              isVisible = false;
            }
          } else if (filtros.areaMin) {
            // Se não tem área informada e há filtro de área mínima, ocultar
            isVisible = false;
          }
        }
  
        // Quartos
        if (filtros.quartos !== null) {
          const quartosElement = card.querySelector('.info-item img[alt="Quartos"]');
          if (quartosElement) {
            const quartosTexto = quartosElement.parentElement.querySelector('span')?.textContent || '';
            const quartosNumero = parseInt(quartosTexto.replace(/\D/g, ''));
            
            if (!quartosNumero || quartosNumero < filtros.quartos) {
              isVisible = false;
            }
          } else {
            // Se não tem quartos informados e há filtro de quartos, ocultar
            isVisible = false;
          }
        }
  
        // Banheiros
        if (filtros.banheiros !== null) {
          const banheirosElement = card.querySelector('.info-item img[alt="Banheiro"]');
          if (banheirosElement) {
            const banheirosTexto = banheirosElement.parentElement.querySelector('span')?.textContent || '';
            const banheirosNumero = parseInt(banheirosTexto.replace(/\D/g, ''));
            
            if (!banheirosNumero || banheirosNumero < filtros.banheiros) {
              isVisible = false;
            }
          } else {
            // Se não tem banheiros informados e há filtro de banheiros, ocultar
            isVisible = false;
          }
        }
  
        // Vagas
        if (filtros.vagas !== null) {
          const vagasElement = card.querySelector('.info-item img[alt="Vaga"]');
          if (vagasElement) {
            const vagasTexto = vagasElement.parentElement.querySelector('span')?.textContent || '';
            const vagasNumero = parseInt(vagasTexto.replace(/\D/g, ''));
            
            if (!vagasNumero || vagasNumero < filtros.vagas) {
              isVisible = false;
            }
          } else {
            // Se não tem vagas informadas e há filtro de vagas, ocultar
            isVisible = false;
          }
        }
  
        // Piscina e Churrasqueira
        if (filtros.piscina) {
          const temPiscina = card.textContent.toLowerCase().includes('piscina');
          if (!temPiscina) {
            isVisible = false;
          }
        }
  
        if (filtros.churrasqueira) {
          const temChurrasqueira = card.textContent.toLowerCase().includes('churrasqueira');
          if (!temChurrasqueira) {
            isVisible = false;
          }
        }
      }
  
      // Aplicar visibilidade
      if (isVisible) {
        card.style.display = 'block';
        visiveisCount++;
        
        if (card.classList.contains('card-empreendimento-link')) {
          empreendimentosVisiveis++;
        } else {
          imoveisVisiveis++;
        }
      } else {
        card.style.display = 'none';
      }
    });
  
    // Atualizar contador
    atualizarContador(visiveisCount, empreendimentosVisiveis, imoveisVisiveis);
  
    // Mostrar/esconder mensagem de "nenhum resultado"
    const nenhumEncontrado = document.querySelector('.nenhum-encontrado');
    if (nenhumEncontrado) {
      nenhumEncontrado.style.display = visiveisCount === 0 ? 'block' : 'none';
    }
  }

  // ================================
  // Preço editável formatado
  // ================================
  if (precoEditavel) {
    precoEditavel.addEventListener('input', function () {
      let texto = this.innerText.replace(',00', '').replace(/\D/g, '');

      if (texto) {
        const numero = parseInt(texto);
        const formatado = numero.toLocaleString('pt-BR');
        this.innerText = formatado + ',00';
        precoReal.value = numero;
        placeCaretBeforeComma(this);
      } else {
        this.innerText = '0,00';
        precoReal.value = '';
      }
      
      // Aplicar filtros após atualizar preço
      aplicarFiltrosCompletos();
    });

    precoEditavel.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
  }

  // ================================
  // Pesquisa rápida com sugestões
  // ================================
  function configurarPesquisa(termoInput, sugestoesBox, btnLimpar) {
    if (!termoInput) return;

    termoInput.addEventListener('input', function () {
      const termo = this.value.toLowerCase().trim();
      
      if (termo.length >= 2) {
        const sugestoes = new Set();
        const cards = document.querySelectorAll('.card-link');
        
        cards.forEach(card => {
          let textoCard = '';
          
          if (!card.classList.contains('card-empreendimento-link')) {
            const imagem = card.querySelector('.card-imagem img');
            const titulo = imagem ? imagem.getAttribute('alt') || '' : '';
            const tipo = card.querySelector('.card-info_principal h1')?.textContent || '';
            const bairro = card.querySelector('.bairro')?.textContent || '';
            const cidade = card.querySelector('.cidade')?.textContent || '';
            
            [titulo, tipo, bairro, cidade].forEach(item => {
              if (item && item.toLowerCase().includes(termo)) {
                sugestoes.add(item.trim());
              }
            });
          } else {
            const nome = card.querySelector('.card-info_principal h1')?.textContent || '';
            const bairro = card.querySelector('.bairro')?.textContent || '';
            const cidade = card.querySelector('.cidade')?.textContent || '';
            
            [nome, bairro, cidade].forEach(item => {
              if (item && item.toLowerCase().includes(termo)) {
                sugestoes.add(item.trim());
              }
            });
          }
        });
        
        if (sugestoes.size > 0 && sugestoesBox) {
          sugestoesBox.innerHTML = Array.from(sugestoes)
            .slice(0, 5)
            .map(sugestao => `<div class="sugestao-item">${sugestao}</div>`)
            .join('');
          sugestoesBox.style.display = 'block';
          
          // Adicionar eventos de clique nas sugestões
          sugestoesBox.querySelectorAll('.sugestao-item').forEach(item => {
            item.addEventListener('click', () => {
              termoInput.value = item.textContent;
              sugestoesBox.style.display = 'none';
              aplicarFiltrosCompletos();
            });
          });
        } else if (sugestoesBox) {
          sugestoesBox.style.display = 'none';
        }
      } else if (sugestoesBox) {
        sugestoesBox.style.display = 'none';
      }
      
      aplicarFiltrosCompletos();
    });

    if (btnLimpar) {
      btnLimpar.addEventListener('click', () => {
        termoInput.value = '';
        if (sugestoesBox) {
          sugestoesBox.style.display = 'none';
        }
        aplicarFiltrosCompletos();
      });
    }
  }

  // Configurar pesquisa para mobile e desktop
  configurarPesquisa(termoInputMobile, sugestoesBoxMobile, btnLimparMobile);
  configurarPesquisa(termoInputDesktop, sugestoesBoxDesktop, btnLimparDesktop);

  // Fechar sugestões ao clicar fora
  document.addEventListener('click', (e) => {
    if (sugestoesBoxMobile && !e.target.closest('#termo-pesquisa') && !e.target.closest('#sugestoes-pesquisa')) {
      sugestoesBoxMobile.style.display = 'none';
    }
    if (sugestoesBoxDesktop && !e.target.closest('#termo-pesquisa-desktop') && !e.target.closest('#sugestoes-pesquisa-desktop')) {
      sugestoesBoxDesktop.style.display = 'none';
    }
  });

  // ================================
  // Event listeners para filtros automáticos
  // ================================
  
  // Tipo de imóvel
  if (tipoSelect) {
    tipoSelect.addEventListener('change', aplicarFiltrosCompletos);
  }
  
  // Localização
  if (localizacaoInput) {
    localizacaoInput.addEventListener('input', aplicarFiltrosCompletos);
  }
  
  // Área mínima
  if (areaMinInput) {
    areaMinInput.addEventListener('input', aplicarFiltrosCompletos);
  }
  
  // Área máxima
  if (areaMaxInput) {
    areaMaxInput.addEventListener('input', aplicarFiltrosCompletos);
  }
  
  // Quartos
  if (quartosInput) {
    quartosInput.addEventListener('input', aplicarFiltrosCompletos);
  }
  
  // Banheiros
  if (banheirosInput) {
    banheirosInput.addEventListener('input', aplicarFiltrosCompletos);
  }
  
  // Vagas de garagem
  if (vagasInput) {
    vagasInput.addEventListener('input', aplicarFiltrosCompletos);
  }
  
  // Piscina
  if (piscinaCheckbox) {
    piscinaCheckbox.addEventListener('change', aplicarFiltrosCompletos);
  }
  
  // Churrasqueira
  if (churrasqueiraCheckbox) {
    churrasqueiraCheckbox.addEventListener('change', aplicarFiltrosCompletos);
  }

  // ================================
  // Função de filtragem unificada
  // ================================
  window.filtrarImoveis = function() {
    aplicarFiltrosCompletos();
  };

  // ================================
  // Inicialização
  // ================================
  // Aplicar filtros iniciais para mostrar todos os resultados
  setTimeout(() => {
    aplicarFiltrosCompletos();
  }, 100);
});