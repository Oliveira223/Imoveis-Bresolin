    const apiUrl = '/api/slides/data';
    let slidesData = [];
    let currentIndex = 0;
    let timerId = null;
    // Pega o valor default injetado pelo HTML, ou usa 8 como fallback
    let intervalSeconds = (window.SLIDES_CONFIG && window.SLIDES_CONFIG.defaultInterval) || 8;

    function formatPreco(preco) {
      if (preco === null || preco === undefined) return '';
      try {
        return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
      } catch (e) {
        return 'R$ ' + preco;
      }
    }

    function buildLocation(imovel) {
      const partes = [];
      if (imovel.bairro) partes.push(imovel.bairro);
      if (imovel.cidade) partes.push(imovel.cidade);
      return partes.join(' · ');
    }

    function createSlide(imovel) {
      const slide = document.createElement('div');
      slide.className = 'slide';

      // 1. Background Image
      const bg = document.createElement('div');
      bg.className = 'slide-bg';
      if (imovel.imagem) {
        bg.style.backgroundImage = `url("${imovel.imagem}")`;
      }
      slide.appendChild(bg);

      // 2. Overlay Gradient
      const overlay = document.createElement('div');
      overlay.className = 'slide-overlay';
      slide.appendChild(overlay);

      // 3. Content Panel
      const content = document.createElement('div');
      content.className = 'slide-content';

      // Badge (Tipo/Pretensão)
      const tipoOuPretensao = imovel.pretensao || imovel.tipo;
      if (tipoOuPretensao) {
        const badge = document.createElement('div');
        badge.className = 'slide-badge';
        badge.textContent = tipoOuPretensao;
        content.appendChild(badge);
      }

      // Title
      const title = document.createElement('h1');
      title.className = 'slide-title';
      title.textContent = imovel.titulo || 'Imóvel sem título';
      content.appendChild(title);

      // Location
      const locText = buildLocation(imovel);
      if (locText) {
        const loc = document.createElement('div');
        loc.className = 'slide-location';
        // Ícone de pin simples
        loc.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ddd"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg> ${locText}`;
        content.appendChild(loc);
      }

      // Price
      if (imovel.preco) {
        const price = document.createElement('div');
        price.className = 'slide-price';
        price.textContent = formatPreco(imovel.preco);
        content.appendChild(price);
      }

      // Stats Grid
      const statsGrid = document.createElement('div');
      statsGrid.className = 'slide-stats';
      
      const stats = [
        { 
            val: imovel.area, 
            label: 'm²', 
            icon: '<path d="M4 6h16v12H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 12h16" stroke="currentColor" stroke-width="2"/>' // Generic rectangle/ruler
        },
        { 
            val: imovel.quartos, 
            label: 'Quartos', 
            icon: '<path d="M20 10V7c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3c-1.1 0-2 .9-2 2v5h1.33L4 19h1v-2h14v2h1l.67-2H22v-5c0-1.1-.9-2-2-2zM7 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm10 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/>' // Bed
        },
        { 
            val: imovel.banheiros, 
            label: 'Banheiros', 
            icon: '<circle cx="12" cy="4" r="2" fill="currentColor"/><path d="M19 22H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1zM7 13h2v-3h-2v3zm4 0h2v-3h-2v3zm4 0h2v-3h-2v3z" fill="currentColor"/>' // Showerish/Tub
        },
        { 
            val: imovel.vagas, 
            label: 'Vagas', 
            icon: '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="currentColor"/>' // Car
        }
      ];

      let hasStats = false;
      stats.forEach(s => {
        if (s.val) {
            hasStats = true;
            const item = document.createElement('div');
            item.className = 'slide-stat-item';
            // Simple SVG wrapper
            const svg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${s.icon}</svg>`;
            item.innerHTML = `<span class="slide-stat-icon">${svg}</span> ${s.val} ${s.label}`;
            statsGrid.appendChild(item);
        }
      });

      if (hasStats) {
        content.appendChild(statsGrid);
      }

      // Description (Truncated)
      if (imovel.descricao) {
        const desc = document.createElement('div');
        desc.className = 'slide-description';
        // Strip HTML
        const tmp = document.createElement('div');
        tmp.innerHTML = imovel.descricao;
        let text = tmp.textContent || tmp.innerText || '';
        // Limit chars manually just in case CSS line-clamp fails or for safety
        if (text.length > 300) text = text.substring(0, 300) + '...';
        desc.textContent = text;
        content.appendChild(desc);
      }

      // Features Tags
      const features = document.createElement('div');
      features.className = 'slide-features';
      
      if (imovel.suites && imovel.suites > 0) {
        features.innerHTML += `<span class="feature-tag">🚪 ${imovel.suites} Suíte${imovel.suites > 1 ? 's' : ''}</span>`;
      }
      if (imovel.piscina) {
        features.innerHTML += `<span class="feature-tag">🏊 Piscina</span>`;
      }
      if (imovel.churrasqueira) {
        features.innerHTML += `<span class="feature-tag">🍖 Churrasqueira</span>`;
      }
      
      content.appendChild(features);

      // Footer Info (Condo / IPTU)
      const footerInfo = document.createElement('div');
      footerInfo.className = 'slide-footer-info';
      let footerHtml = '';
      if (imovel.condominio) {
        footerHtml += `<div class="footer-item"><strong>Cond:</strong> ${formatPreco(imovel.condominio)}</div>`;
      }
      if (imovel.iptu) {
        footerHtml += `<div class="footer-item"><strong>IPTU:</strong> ${formatPreco(imovel.iptu)}</div>`;
      }
      footerInfo.innerHTML = footerHtml;
      content.appendChild(footerInfo);

      slide.appendChild(content);
      return slide;
    }

    function renderSlides() {
      const container = document.getElementById('slides-container');
      container.innerHTML = '';
      if (!slidesData.length) {
        const div = document.createElement('div');
        div.className = 'slides-loading';
        div.textContent = 'Nenhum imóvel selecionado para slides.';
        container.appendChild(div);
        return;
      }
      slidesData.forEach((imovel, index) => {
        const slide = createSlide(imovel);
        if (index === 0) slide.classList.add('active');
        container.appendChild(slide);
      });
    }

    function showSlide(index) {
      const slides = document.querySelectorAll('.slide');
      if (!slides.length) return;
      slides.forEach(s => s.classList.remove('active'));
      const total = slides.length;
      const i = ((index % total) + total) % total;
      slides[i].classList.add('active');
      currentIndex = i;
    }

    function startLoop() {
      if (timerId) {
        clearInterval(timerId);
      }
      timerId = setInterval(function () {
        showSlide(currentIndex + 1);
      }, intervalSeconds * 1000);
    }

    async function loadData() {
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error('Erro ao carregar dados');
        }
        const data = await res.json();
        slidesData = data.imoveis || [];
        const apiInterval = data.interval_seconds;
        if (apiInterval !== null && apiInterval !== undefined) {
          intervalSeconds = parseInt(apiInterval, 10);
        }
        
        // Validação extra caso venha inválido da API
        if (!intervalSeconds || isNaN(intervalSeconds)) {
           // Tenta usar o default injetado, ou 8
           intervalSeconds = (window.SLIDES_CONFIG && window.SLIDES_CONFIG.defaultInterval) || 8;
        }
        
        if (intervalSeconds < 3) intervalSeconds = 3;
        if (intervalSeconds > 60) intervalSeconds = 60;

        renderSlides();
        showSlide(0);
        startLoop();
      } catch (e) {
        console.error(e);
        const container = document.getElementById('slides-container');
        container.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'slides-loading';
        div.textContent = 'Erro ao carregar imóveis.';
        container.appendChild(div);
      }
    }

    document.addEventListener('DOMContentLoaded', loadData);
