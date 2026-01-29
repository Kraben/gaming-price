// Gamer Price MX – ML, eBay, CEX, Amazon, CheapShark
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
    const usdData = await usdRes.json().catch(() => ({}));
    const gbpData = await gbpRes.json().catch(() => ({}));
    if (usdData.rates) {
      ratesCache = { usd: usdData.rates.MXN, gbp: gbpData.rates?.MXN || null, date: usdData.date };
      return ratesCache;
    }
  } catch (e) { console.warn('Tasas no disponibles', e); }
  return null;
}

function updateRatesBanner(rates) {
  const el = document.getElementById('ratesBanner');
  if (!el || !rates) return;
  el.textContent = `1 USD = ${rates.usd.toFixed(2)} MXN | 1 GBP = ${rates.gbp?.toFixed(2) || '—'} MXN. Fuente: Frankfurter.`;
}

function convertToMxn(items, fromCurrency, rates) {
  if (!rates) return items;
  const rate = fromCurrency === 'GBP' ? rates.gbp : rates.usd;
  if (!rate) return items;
  return items.map(item => ({
    ...item,
    price: Math.round(item.price * rate * 100) / 100,
    priceOriginal: item.price,
    currencyOriginal: fromCurrency
  }));
}

function renderItem(item, color, currency = 'MXN') {
  const title = item.title || 'Sin título';
  const thumb = item.thumbnail || item.image || '';
  const price = Number(item.price).toLocaleString('es-MX');
  const orig = item.priceOriginal ? `<span class="text-gray-500 text-[10px] font-normal">(~$${item.priceOriginal} ${item.currencyOriginal})</span>` : '';

  return `
    <a href="${item.permalink}" target="_blank" class="block bg-gray-900/80 rounded-lg p-3 border-l-4 ${color} hover:bg-gray-800 transition flex gap-3 items-center no-underline text-inherit mb-2">
      <img src="${thumb}" class="w-11 h-11 object-contain bg-white rounded" onerror="this.style.display='none'">
      <div class="flex-1 min-w-0">
        <div class="text-gray-200 text-sm font-medium truncate">${title}</div>
        <div class="text-lg font-black ${color.replace('border-', 'text-')}">$${price} ${currency} ${orig}</div>
      </div>
    </a>`;
}

function setBlocked(id, title, hint, linkUrl, linkText) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `
    <div class="rounded-lg p-4 bg-orange-950/30 border border-orange-500/50 text-center">
      <div class="text-orange-400 font-bold text-xs mb-1 uppercase">${title}</div>
      <div class="text-gray-400 text-[10px] mb-3">${hint}</div>
      <a href="${linkUrl}" target="_blank" class="inline-block bg-orange-600 text-white text-[10px] font-bold py-2 px-4 rounded-full uppercase no-underline">
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
    if (el) el.innerHTML = '<p class="text-gray-500 text-sm italic animate-pulse">Buscando...</p>';
  });

  const rates = await getRates();
  updateRatesBanner(rates);

  const run = async (fn, resultId, color, currency = 'MXN', opts = {}) => {
    try {
      const data = await fn();
      let items = Array.isArray(data) ? data : (data.results || []);
      
      if (rates && (currency === 'USD' || currency === 'GBP')) {
        items = convertToMxn(items, currency, rates);
      }
      
      items.sort((a, b) => a.price - b.price);

      const el = document.getElementById(resultId);
      if (items.length === 0) {
        el.innerHTML = '<p class="text-gray-600 text-xs italic">Sin resultados.</p>';
      } else {
        el.innerHTML = items.slice(0, 6).map(item => renderItem(item, color, 'MXN')).join('');
      }
    } catch (e) {
      if (opts.blockedUi) {
        setBlocked(resultId, 'Tienda Protegida', 'No pudimos obtener precios automáticos.', '#', 'Buscar Manualmente');
      } else {
        document.getElementById(resultId).innerHTML = `<p class="text-red-500 text-[10px]">Error de conexión</p>`;
      }
    }
  };

  // 1. AMAZON
  run(async () => {
    const r = await fetch(`${API.amazon}?query=${encodeURIComponent(query)}`);
    return await r.json();
  }, 'amazonResults', 'border-yellow-700', 'MXN');

  // 2. MERCADO LIBRE
  run(async () => {
    const r = await fetch(`${API.ml}?query=${encodeURIComponent(query)}`);
    return await r.json();
  }, 'mlResults', 'border-yellow-500', 'MXN', { blockedUi: true });

  // 3. EBAY
  run(async () => {
    const r = await fetch(`${API.ebay}?query=${encodeURIComponent(query)}`);
    return await r.json();
  }, 'ebayResults', 'border-green-600', 'USD');

  // 4. CEX
  run(async () => {
    const r = await fetch(`${API.cex}?query=${encodeURIComponent(query)}`);
    if (!r.ok) throw new Error();
    return await r.json();
  }, 'cexResults', 'border-orange-500', 'MXN', { blockedUi: true });

  // 5. DIGITAL
  run(async () => {
    const r = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}`);
    const list = await r.json();
    return list.map(x => ({ title: x.external, price: x.cheapest, thumbnail: x.thumb, permalink: `https://www.cheapshark.com/redirect?dealID=${x.cheapestDealID}` }));
  }, 'digitalResults', 'border-blue-500', 'USD');
}

document.getElementById('searchBtn').onclick = buscar;
document.getElementById('gameInput').onkeypress = (e) => { if (e.key === 'Enter') buscar(); };
