/* ---- Loader ---- */
(function () {
  const style = document.createElement('style');
  style.textContent = '@keyframes drawPath { to { stroke-dashoffset: 0; } }';
  document.head.appendChild(style);
  document.querySelectorAll('.logo-animate path').forEach((p, i) => {
    p.style.animation = `drawPath 0.9s ${i * 0.3}s cubic-bezier(.16,1,.3,1) forwards`;
  });
  window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('loader').classList.add('oculto'), 900);
  });
})();

/* ---- Galeria mobile ---- */
let fotoAtual = 0;
const galPrincipal = document.getElementById('galeria-principal');
const galContador  = document.getElementById('galeria-contador');

function trocarFoto(idx, el) {
  if (!fotos.length) return;
  fotoAtual = ((idx % fotos.length) + fotos.length) % fotos.length;
  if (galPrincipal) galPrincipal.src = fotos[fotoAtual];
  if (galContador)  galContador.textContent = `${fotoAtual + 1} / ${fotos.length}`;
  const thumbs = document.querySelectorAll('.galeria-scroll-mobile img');
  thumbs.forEach(img => img.classList.remove('ativa'));
  const alvo = el || thumbs[fotoAtual];
  if (alvo) {
    alvo.classList.add('ativa');
    alvo.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}

/* Swipe na foto principal mobile */
if (galPrincipal) {
  let tX = 0;
  galPrincipal.addEventListener('touchstart', e => { tX = e.touches[0].clientX; }, { passive: true });
  galPrincipal.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tX;
    if (Math.abs(dx) > 40) trocarFoto(fotoAtual + (dx < 0 ? 1 : -1), null);
  }, { passive: true });
}

/* ---- Viewer fullscreen ---- */
let viewerIdx = 0;
const viewer        = document.getElementById('imagem-viewer');
const viewerImg     = document.getElementById('viewer-img');
const viewerCounter = document.getElementById('viewer-counter');

function abrirViewer(idx) {
  if (!fotos.length) return;
  viewerIdx = ((idx % fotos.length) + fotos.length) % fotos.length;
  viewer.classList.add('aberto');
  document.body.style.overflow = 'hidden';
  _atualizarViewer();
}

function fecharViewer() {
  viewer.classList.remove('aberto');
  document.body.style.overflow = '';
}

function navViewer(dir) {
  viewerIdx = ((viewerIdx + dir) % fotos.length + fotos.length) % fotos.length;
  _atualizarViewer();
}

function _atualizarViewer() {
  viewerImg.src = fotos[viewerIdx];
  if (viewerCounter) viewerCounter.textContent = `${viewerIdx + 1} / ${fotos.length}`;
}

document.getElementById('viewer-close').addEventListener('click', fecharViewer);
document.getElementById('viewer-prev').addEventListener('click', () => navViewer(-1));
document.getElementById('viewer-next').addEventListener('click', () => navViewer(1));

/* Fechar ao clicar no fundo */
viewer.addEventListener('click', e => { if (e.target === viewer) fecharViewer(); });

/* Teclado */
document.addEventListener('keydown', e => {
  if (!viewer.classList.contains('aberto')) return;
  if (e.key === 'Escape')     fecharViewer();
  if (e.key === 'ArrowLeft')  navViewer(-1);
  if (e.key === 'ArrowRight') navViewer(1);
});

/* Swipe no viewer */
let vTX = 0;
viewer.addEventListener('touchstart', e => { vTX = e.touches[0].clientX; }, { passive: true });
viewer.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - vTX;
  if (Math.abs(dx) > 50) navViewer(dx < 0 ? 1 : -1);
}, { passive: true });

/* ---- Modo escuro ---- */
function alternarTema() {
  const isDark = document.body.classList.toggle('modo-escuro');
  document.getElementById('icone-tema').src = isDark
    ? '/static/img/icons/icon_sun.svg'
    : '/static/img/icons/icon_moon.svg';
  localStorage.setItem('tema', isDark ? 'escuro' : 'claro');
}

if (localStorage.getItem('tema') === 'escuro') {
  document.body.classList.add('modo-escuro');
  const icone = document.getElementById('icone-tema');
  if (icone) icone.src = '/static/img/icons/icon_sun.svg';
}
