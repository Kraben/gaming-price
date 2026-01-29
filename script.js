// ... (Mantén tus variables BASE, API y la función getRates igual al principio)

function renderItem(item, color, currency = 'MXN') {
  const thumb = item.thumbnail || '';
  const price = Number(item.price).toLocaleString('es-MX');
  return `
    <a href="${item.permalink}" target="_blank" class="block bg-gray-900/80 rounded-lg p-3 border-l-4 ${color} hover:bg-gray-800 transition flex gap-3 items-center no-underline text-inherit mb-2">
      <img src="${thumb}" class="w-11 h-11 object-contain bg-white rounded" onerror="this.style.display='none'">
      <div class="flex-1 min-w-0">
        <div class="text-gray-200 text-sm font-medium truncate">${item.title}</div>
        <div class="text-lg font-black ${color.replace('border-', 'text-')}">$${price} ${currency}</div>
      </div>
    </a>`;
}

function setBlocked(id, title, hint, linkUrl, linkText) {
  const el = document.getElementById(id);
  if (!el) return;
  // Recuperamos el diseño naranja de advertencia
  el.innerHTML = `
    <div class="rounded-lg p-4 bg-orange-950/20 border border-orange-500/40 text-center my-2">
      <div class="text-orange-500 font-bold text-xs mb-1 uppercase tracking-widest">${title}</div>
      <div class="text-gray-400 text-[10px] mb-3 leading-tight">${hint}</div>
      <a href="${linkUrl}" target="_blank" class="inline-block bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black py-2 px-6 rounded-full uppercase no-underline transition-all shadow-lg">
        ${linkText} ↗
      </a>
    </div>`;
}

async function buscar() {
  const query = document.getElementById('gameInput')?.value?.trim();
  if (!query) return;

  const ids = ['amazonResults', 'mlResults', 'ebayResults', 'cexResults', 'digitalResults'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<p class="text-gray-500 text-xs italic animate-pulse">Buscando...</p>';
  });

  const rates = await getRates();

  const run = async (fn, resultId, color, currency = 'MXN') => {
    try {
      const data = await fn();
      let rawItems = data.results || data || [];
      
      // FILTRO DE CALIDAD: Eliminamos ceros y artículos que no son juegos [cite: Captura de pantalla 2026
