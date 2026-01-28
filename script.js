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

function setBlocked(id, title, hint, linkUrl, linkText) {
  const el = document.getElementById(id);
  if (!el) return;
  const link = linkUrl && linkText
    ? `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener" class="text-blue-400 underline">${escapeHtml(linkText)}</a>`
    : '';
  el.innerHTML = `
    <div class="rounded-lg p-3 bg-amber-900/20 border border-amber-500/50 text-amber-200 text-sm">
      <div class="font-bold mb-1">${escapeHtml(title)}</div>
      <div class="opacity-90">${escapeHtml(hint)}</div>
      ${link ? `<div class="mt-2">${link}</div>` : ''}
    </div>`;
}

function setEmpty(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '<p class="text-gray-500 text-sm italic">Sin resultados.</p>';
}

function setResults(id, items, color, currency = 'MXN', note = null) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!items?.length) {
    setEmpty(id);
    return;
  }
  const listHtml = items.slice(0, 6).map(item => renderItem(item, color, currency)).join('');
  const noteHtml = note ? `<div class="rounded-lg p-2 mb-2 bg-amber-900/20 border border-amber-500/40 text-amber-200 text-xs">${escapeHtml(note)}</div>` : '';
  el.innerHTML = noteHtml + listHtml;
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

  const run = async (fn, resultId, color, currency = 'MXN', opts = {}) => {
    try {
      const raw = await fn();
      const isObj = raw && !Array.isArray(raw) && raw.items;
      const items = isObj ? raw.items : raw;
      const cur = (isObj && raw.currency) ? raw.currency : currency;
      const note = (isObj && opts.fallbackKey && raw[opts.fallbackKey]) ? raw[opts.fallbackKey] : null;
      setResults(resultId, items, color, cur, note);
    } catch (e) {
      const msg = e.message || 'Error';
      if (opts.blockedUi && (msg.includes('PolicyAgent') || msg === 'NO_CREDENTIALS' || msg.includes('CEX') || msg.includes('bloqueó'))) {
        if (msg === 'NO_CREDENTIALS') {
          setBlocked(resultId, '⚠️ ML sin configurar', 'Añade ML_CLIENT_ID y ML_CLIENT_SECRET en Vercel → Settings → Environment Variables.', null, null);
        } else if (msg.includes('PolicyAgent') || msg.includes('mercadolibre')) {
          setBlocked(resultId, '⚠️ Mercado Libre no disponible', 'La API de búsqueda está restringida (PolicyAgent). Busca en mercadolibre.com.mx.', 'https://www.mercadolibre.com.mx/', 'mercadolibre.com.mx');
        } else {
          setBlocked(resultId, '⚠️ ' + (resultId === 'cexResults' ? 'CEX' : 'Fuente') + ' no disponible', msg, resultId === 'cexResults' ? 'https://mexico.webuy.com/' : null, resultId === 'cexResults' ? 'mexico.webuy.com' : null);
        }
      } else {
        setError(resultId, msg);
      }
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
      if (r.status === 500 && d.code === 'NO_CREDENTIALS') {
        throw new Error('NO_CREDENTIALS');
      }
      throw new Error(d.error || d.message || `ML: ${r.status}`);
    }
    return d.results ?? [];
  }, 'mlResults', 'border-yellow-500', 'MXN', { blockedUi: true });

  // eBay
  run(async () => fetchApi(API.ebay, query, 'query'), 'ebayResults', 'border-green-500', 'USD');

  // CEX: MX primero; si 403, backend prueba UK y devuelve { results, currency, fallback? }
  run(async () => {
    const r = await fetch(`${API.cex}?query=${encodeURIComponent(query)}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 403 || d.blocked) throw new Error('CEX bloqueó la petición. Prueba en mexico.webuy.com o uk.webuy.com.');
      throw new Error(d.error || d.message || `CEX: ${r.status}`);
    }
    return { items: d.results ?? [], currency: d.currency || 'MXN', fallback: d.fallback || null };
  }, 'cexResults', 'border-orange-500', 'MXN', { blockedUi: true, fallbackKey: 'fallback' });

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
