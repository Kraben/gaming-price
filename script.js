// Gamer Price MX – ML, eBay, CEX, CheapShark
// Producción: Vercel serverless (/api/*). Desarrollo: backend local.

// Siempre usar mismo origen: en Vercel = producción; en local con `vercel dev` = /api/* desde api/
const BASE = window.location.origin;
const API = {
  ml: `${BASE}/api/mercadolibre`,
  ebay: `${BASE}/api/ebay`,
  cex: `${BASE}/api/cex`
};

function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function renderItem(item, color, currency = 'MXN') {
  const price = item.price ?? 0;
  const title = escapeHtml(item.title || 'Sin título');
  const thumb = item.thumbnail || '';
  const link = item.permalink || '#';
  const img = thumb
    ? `<img src="${escapeHtml(thumb)}" alt="" class="w-11 h-11 object-contain bg-white rounded" loading="lazy">`
    : '';
  return `
    <a href="${escapeHtml(link)}" target="_blank" rel="noopener" class="block bg-gray-900/80 rounded-lg p-3 border-l-4 ${color} hover:bg-gray-800/80 transition flex gap-3 items-center no-underline text-inherit">
      ${img}
      <div class="flex-1 min-w-0">
        <div class="text-gray-200 text-sm font-medium truncate">${title}</div>
        <div class="text-lg font-black ${color.replace('border-', 'text-')}">$${Number(price).toLocaleString('es-MX')} ${currency}</div>
      </div>
    </a>`;
}

function setLoading(ids, label = 'Buscando…') {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p class="text-gray-500 text-sm italic">${label}</p>`;
  });
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="rounded-lg p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-sm">${escapeHtml(msg)}</div>`;
}

function setEmpty(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '<p class="text-gray-500 text-sm italic">Sin resultados.</p>';
}

function setResults(id, items, color, currency = 'MXN') {
  const el = document.getElementById(id);
  if (!el) return;
  if (!items?.length) {
    setEmpty(id);
    return;
  }
  el.innerHTML = items.slice(0, 6).map(item => renderItem(item, color, currency)).join('');
}

async function fetchApi(url, q, queryKey = 'query') {
  const u = `${url}?${queryKey}=${encodeURIComponent(q)}`;
  const res = await fetch(u);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data.results ?? data;
}

async function buscar() {
  const query = document.getElementById('gameInput')?.value?.trim();
  if (!query) return;

  setLoading(['mlResults', 'ebayResults', 'cexResults', 'digitalResults'], '🔍 Buscando…');

  const run = async (fn, resultId, color, currency = 'MXN') => {
    try {
      const items = await fn();
      setResults(resultId, items, color, currency);
    } catch (e) {
      setError(resultId, e.message || 'Error');
    }
  };

  // ML
  run(async () => {
    const r = await fetch(`${API.ml}?query=${encodeURIComponent(query)}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (d.blocked_by === 'PolicyAgent' || r.status === 403) {
        throw new Error('ML bloqueado (PolicyAgent). Busca en mercadolibre.com.mx');
      }
      throw new Error(d.error || d.message || `ML: ${r.status}`);
    }
    return d.results ?? [];
  }, 'mlResults', 'border-yellow-500');

  // eBay
  run(async () => fetchApi(API.ebay, query, 'query'), 'ebayResults', 'border-green-500', 'USD');

  // CEX
  run(async () => fetchApi(API.cex, query, 'query'), 'cexResults', 'border-orange-500');

  // CheapShark (directo, sin backend)
  run(async () => {
    const r = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}`);
    if (!r.ok) throw new Error(`CheapShark: ${r.status}`);
    const list = await r.json();
    return (list || []).map(x => ({
      title: x.external,
      price: x.cheapest,
      permalink: x.cheapestDealID ? `https://www.cheapshark.com/redirect?dealID=${x.cheapestDealID}` : null
    }));
  }, 'digitalResults', 'border-blue-500', 'USD');
}

document.getElementById('searchBtn').onclick = buscar;
document.getElementById('gameInput')?.addEventListener('keypress', e => {
  if (e.key === 'Enter') buscar();
});
