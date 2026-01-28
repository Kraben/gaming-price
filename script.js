// Gamer Price MX – ML, eBay, CEX, CheapShark
// Producción: Vercel serverless (/api/*).
// Tipos de cambio: Frankfurter. Precios mostrados en MXN.

const BASE = window.location.origin;
const API = {
  ml: `${BASE}/api/mercadolibre`,
  ebay: `${BASE}/api/ebay`,
  cex: `${BASE}/api/cex`
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
    const usd = usdData.rates && usdData.rates.MXN ? Number(usdData.rates.MXN) : null;
    const gbp = gbpData.rates && gbpData.rates.MXN ? Number(gbpData.rates.MXN) : null;
    if (usd != null) {
      ratesCache = { usd, gbp, date: usdData.date || '' };
      return ratesCache;
    }
  } catch (e) {
    console.warn('Tipo de cambio no disponible:', e);
  }
  return null;
}

function updateRatesBanner(rates) {
  const el = document.getElementById('ratesBanner');
  if (!el) return;
  if (!rates) {
    el.textContent = 'Tipo de cambio no disponible. Precios en moneda original.';
    return;
  }
  let t = `1 USD = ${rates.usd.toFixed(2)} MXN`;
  if (rates.gbp != null) t += ` · 1 GBP = ${rates.gbp.toFixed(2)} MXN`;
  t += '. Precios convertidos a MXN.';
  el.textContent = t;
}

function convertToMxn(items, fromCurrency, rates) {
  if (!rates || !items || !items.length) return items;
  const rate = fromCurrency === 'GBP' ? rates.gbp : rates.usd;
  if (rate == null) return items;
  return items.map(item => {
    const orig = Number(item.price) || 0;
    return Object.assign({}, item, {
      price: Math.round(orig * rate * 100) / 100,
      priceOriginal: orig,
      currencyOriginal: fromCurrency
    });
  });
}

function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function renderItem(item, color, currency = 'MXN') {
  const price = item.price ?? 0;
  const title = escapeHtml(item.title || 'Sin título');
  const thumb = item.thumbnail || item.image || ''; // Acepta ambos nombres
  const link = item.permalink || item.url || '#';
  const img = thumb
    ? `<img src="${escapeHtml(thumb)}" alt="" class="w-11 h-11 object-contain bg-white rounded" loading="lazy">`
    : `<div class="w-11 h-11 bg-gray-700 rounded flex items-center justify-center text-[10px]">N/A</div>`;
  
  const orig = item.priceOriginal != null && item.currencyOriginal;
  const origLabel = orig ? ` <span class="text-gray-500 text-xs font-normal">(~$${Number(item.priceOriginal).toLocaleString()} ${item.currencyOriginal})</span>` : '';
  
  return `
    <a href="${escapeHtml(link)}" target="_blank" rel="noopener" class="block bg-gray-900/80 rounded-lg p-3 border-l-4 ${color} hover:bg-gray-800/80 transition flex gap-3 items-center no-underline text-inherit mb-2">
      ${img}
      <div class="flex-1 min-w-0">
        <div class="text-gray-200 text-sm font-medium truncate">${title}</div>
        <div class="text-lg font-black ${color.replace('border-', 'text-')}">$${Number(price).toLocaleString()} ${currency}${origLabel}</div>
      </div>
    </a>`;
}

function setLoading(ids, label = 'Buscando…') {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p class="text-gray-500 text-sm italic animate-pulse">${label}</p>`;
  });
}

function setBlocked(id, title, hint, linkUrl, linkText) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `
    <div class="rounded-lg p-3 bg-amber-900/20 border border-amber-500/50 text-amber-200 text-sm text-center">
      <div class="font-bold mb-1">${escapeHtml(title)}</div>
      <div class="opacity-90 text-xs mb-3">${escapeHtml(hint)}</div>
      <a href="${escapeHtml(linkUrl)}" target="_blank" class="inline-block bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold py-2 px-4 rounded uppercase no-underline">
        ${escapeHtml(linkText)} ↗
      </a>
    </div>`;
}

function setResults(id, items, color, currency = 'MXN', note = null) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!items?.length) {
    el.innerHTML = '<p class="text-gray-500 text-sm italic">Sin resultados.</p>';
    return;
  }
  const listHtml = items.slice(0, 6).map(item => renderItem(item, color, currency)).join('');
  const noteHtml = note ? `<div class="rounded-lg p-2 mb-2 bg-blue-900/20 border border-blue-500/40 text-blue-200 text-[10px]">${escapeHtml(note)}</div>` : '';
  el.innerHTML = noteHtml + listHtml;
}

async function buscar() {
  const query = document.getElementById('gameInput')?.value?.trim();
  if (!query) return;

  setLoading(['mlResults', 'ebayResults', 'cexResults', 'digitalResults']);

  const rates = await getRates();
  updateRatesBanner(rates);

  const run = async (fn, resultId, color, currency = 'MXN', opts = {}) => {
    try {
      const raw = await fn();
      let items = Array.isArray(raw) ? raw : (raw.items || []);
      let cur = raw.currency || currency;
      const note = (opts.fallbackKey && raw[opts.fallbackKey]) ? raw[opts.fallbackKey] : null;

      if (rates && (cur === 'USD' || cur === 'GBP') && items.length) {
        items = convertToMxn(items, cur, rates);
        cur = 'MXN';
      }
      setResults(resultId, items, color, cur, note);
    } catch (e) {
      if (opts.blockedUi) {
        if (resultId === 'cexResults') {
          setBlocked(resultId, 'CeX No Disponible', 'La API está protegida por seguridad.', `https://mx.webuy.com/search?stext=${encodeURIComponent(query)}`, 'Buscar en Webuy MX');
        } else if (resultId === 'mlResults') {
          setBlocked(resultId, 'ML Bloqueado', 'Búsqueda restringida por API.', `https://www.mercadolibre.com.mx/jm/search?as_word=${encodeURIComponent(query)}`, 'Ir a Mercado Libre');
        }
      } else {
        const el = document.getElementById(resultId);
        if (el) el.innerHTML = `<p class="text-red-500 text-xs">Error: ${e.message}</p>`;
      }
    }
  };

  // 1. MERCADO LIBRE
  run(async () => {
    const r = await fetch(`${API.ml}?query=${encodeURIComponent(query)}`);
    const d = await r.json();
    if (!r.ok) throw new Error("BLOCKED");
    return d.results || [];
  }, 'mlResults', 'border-yellow-500', 'MXN', { blockedUi: true });

  // 2. EBAY (Normalizado)
  run(async () => {
    const r = await fetch(`${API.ebay}?query=${encodeURIComponent(query)}`);
    const d = await r.json();
    
    if (!r.ok) throw new Error("EBAY_ERR");

    // 1. Extraemos y normalizamos los datos básicos
    let items = (d.results || d).map(item => ({
        title: item.title,
        price: parseFloat(item.price?.value || item.price) || 0,
        thumbnail: item.image?.imageUrl || item.thumbnail,
        permalink: item.itemWebUrl || item.permalink,
        currency: 'USD'
    }));

    // 2. Convertimos a MXN primero (si hay tasas disponibles) 
    // para que el ordenamiento sea real sobre el valor final
    if (rates && rates.usd) {
        items = convertToMxn(items, 'USD', rates);
    }

    // 3. ORDENAMIENTO: Del más barato al más caro
    items.sort((a, b) => a.price - b.price);

    return items;
}, 'ebayResults', 'border-green-500', 'MXN');

  // 3. CEX (Sin fetch directo para evitar CORS)
  run(async () => {
    const r = await fetch(`${API.cex}?query=${encodeURIComponent(query)}`);
    if (!r.ok) throw new Error("CEX_BLOCKED");
    const d = await r.json();
    return d; // El servidor ya debe devolver el formato correcto
  }, 'cexResults', 'border-orange-500', 'MXN', { blockedUi: true });

  // 4. CHEAPSHARK (Digital)
  run(async () => {
    const r = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}`);
    const list = await r.json();
    return (list || []).map(x => ({
      title: x.external,
      price: parseFloat(x.cheapest),
      thumbnail: x.thumb,
      permalink: x.cheapestDealID ? `https://www.cheapshark.com/redirect?dealID=${x.cheapestDealID}` : '#'
    }));
  }, 'digitalResults', 'border-blue-500', 'USD');
}

// Eventos
document.getElementById('searchBtn').onclick = buscar;
document.getElementById('gameInput')?.addEventListener('keypress', e => {
  if (e.key === 'Enter') buscar();
});
