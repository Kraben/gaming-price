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
    if (el) el.innerHTML = '<p class="text-gray-500
