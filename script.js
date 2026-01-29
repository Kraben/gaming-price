const BASE = window.location.origin;
const API = {
  ml: `${BASE}/api/mercadolibre`,
  ebay: `${BASE}/api/ebay`,
  cex: `${BASE}/api/cex`,
  amazon: `${BASE}/api/amazon`
};

const RATES_API = 'https://api.frankfurter.dev/v1/latest';
let ratesCache = null;

async function getRates() {
  if (ratesCache) return ratesCache;
  try {
    const [usdRes, gbpRes] = await Promise.all([
      fetch(RATES_API + '?from=USD&to=MXN'),
      fetch(RATES_API + '?from=GBP&to=MXN')
    ]);
    const usdData = await usdRes.json();
    const gbpData = await gbpRes.json();
    if (usdData.rates) {
      ratesCache = { usd: usdData.rates.MXN, gbp: gbpData.rates?.MXN || null };
      return ratesCache;
    }
  } catch (e) { console.warn('Tasas no disponibles'); }
  return null;
}

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
      
      // FILTRO: Limpia ceros y artículos que no son videojuegos
      let items = rawItems.filter(item => {
        const p = Number(item.price);
        const t = item.title.toLowerCase();
        const esBasura = t.includes('novel') || t.includes('libro') || t.includes('playera') || t.includes('camisa') || t.includes('póster') || t.includes('guía') || t.includes('arete');
        return p > 0 && !esBasura;
      });

      if (items.length === 0) throw new Error("EMPTY");

      if (rates && (currency === 'USD' || currency === 'GBP')) {
        const rate = (currency === 'USD') ? rates.usd : rates.gbp;
        items = items.map(it => ({ ...it, price: it.price * rate }));
      }
      
      items.sort((a, b) => a.price - b.price);
      document.getElementById(resultId).innerHTML = items.slice(0, 6).map(it => renderItem(it, color)).join('');
      
    } catch (e) {
      const links = {
        amazonResults: `https://www.amazon.com.mx/s?k=${encodeURIComponent(query)}&i=videogames`,
        mlResults: `https://listado.mercadolibre.com.mx/${encodeURIComponent(query)}`,
        ebayResults: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
        cexResults: `https://mexico.webuy.com/search?stext=${encodeURIComponent(query)}`
      };
      setBlocked(resultId, 'Acceso Limitado', 'Intenta la búsqueda directa:', links[resultId] || '#', 'BUSCAR MANUALMENTE');
    }
  };

  // Ejecución de las llamadas
  run(() => fetch(`${API.amazon}?query=${query}`).then(r => r.json()), 'amazonResults', 'border-yellow-700');
  run(() => fetch(`${API.ml}?query=${query}`).then(r => r.json()), 'mlResults', 'border-yellow-500');
  run(() => fetch(`${API.ebay}?query=${query}`).then(r => r.json()), 'ebayResults', 'border-green-600', 'USD');
  run(() => fetch(`${API.cex}?query=${query}`).then(r => r.json()), 'cexResults', 'border-orange-500');
  
  // CheapShark con enlace de búsqueda corregido
  run(() => fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}`)
    .then(r => r.json())
    .then(d => d.map(x => ({
      title: x.external, 
      price: x.cheapest, 
      thumbnail: x.thumb, 
      permalink: `https://www.cheapshark.com/search#q:${encodeURIComponent(x.external)}`
    }))), 'digitalResults', 'border-blue-500', 'USD');
}

// Eventos del botón y tecla Enter
document.getElementById('searchBtn').onclick = buscar;
document.getElementById('gameInput').onkeypress = (e) => { if (e.key === 'Enter') buscar(); };
