// Gamer Price MX – ML, eBay, CEX, CheapShark
// Producción: Vercel serverless (/api/*). Desarrollo: backend local.
// Tipos de cambio: Frankfurter (api.frankfurter.dev). Precios mostrados en MXN.

// Siempre usar mismo origen: en Vercel = producción; en local con `vercel dev` = /api/* desde api/
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
    const date = usdData.date || gbpData.date || '';
    if (usd != null) {
      ratesCache = { usd, gbp, date };
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
    el.textContent = 'Tipo de cambio no disponible. Algunos precios en moneda original.';
    return;
  }
  const d = rates.date ? new Date(rates.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  let t = `1 USD = ${rates.usd.toFixed(2)} MXN`;
  if (rates.gbp != null) t += ` · 1 GBP = ${rates.gbp.toFixed(2)} MXN`;
  if (d) t += ` (${d})`;
  t += '. Precios en MXN. Fuente: Frankfurter.';
  el.textContent = t;
}

function convertToMxn(items, fromCurrency, rates) {
  if (!rates || !items || !items.length) return items;
  const rate = fromCurrency === 'GBP' ? rates.gbp : rates.usd;
  if (rate == null) return items;
  return items.map(function (item) {
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
  const thumb = item.thumbnail || '';
  const link = item.permalink || '#';
  const img = thumb
    ? `<img src="${escapeHtml(thumb)}" alt="" class="w-11 h-11 object-contain bg-white rounded" loading="lazy">`
    : '';
  const orig = item.priceOriginal != null && item.currencyOriginal;
  const origLabel = orig ? ` <span class="text-gray-500 text-sm font-normal">(~$${Number(item.priceOriginal).toLocaleString('es-MX')} ${item.currencyOriginal})</span>` : '';
  return `
    <a href="${escapeHtml(link)}" target="_blank" rel="noopener" class="block bg-gray-900/80 rounded-lg p-3 border-l-4 ${color} hover:bg-gray-800/80 transition flex gap-3 items-center no-underline text-inherit">
      ${img}
      <div class="flex-1 min-w-0">
        <div class="text-gray-200 text-sm font-medium truncate">${title}</div>
        <div class="text-lg font-black ${color.replace('border-', 'text-')}">$${Number(price).toLocaleString('es-MX')} ${currency}${origLabel}</div>
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

// Fallback: fetch CEX desde el navegador (IP del usuario). Ver https://github.com/Dionakra/webuy-api
function parseCexBoxes(data) {
  var boxes = (data.response && data.response.data && data.response.data.boxes) || data.boxes || [];
  return boxes.map(function (item) {
    var imgs = item.imageUrls || {};
    return {
      id: item.boxId,
      title: item.boxName,
      price: item.sellPrice,
      exchange: item.exchangePrice,
      currency: 'MXN',
      thumbnail: (imgs && imgs.medium) ? imgs.medium : '',
      permalink: 'https://mx.webuy.com/product-detail?id=' + item.boxId
    };
  });
}

async function fetchCexDirect(query) {
  var cexUrl = 'https://wss2.cex.mx.webuy.io/v3/boxes?q=' + encodeURIComponent(query) + '&firstRecord=1&count=20&sortBy=relevance&sortOrder=desc';
  var r = await fetch(cexUrl);
  if (!r.ok) throw new Error('CEX bloqueó la petición. Prueba en mx.webuy.com.');
  var data = await r.json().catch(function () { throw new Error('CEX: respuesta no válida'); });
  var items = parseCexBoxes(data);
  return { items: items, currency: 'MXN', fallback: 'Resultados desde búsqueda directa (tu navegador).' };
}

async function buscar() {
  const query = document.getElementById('gameInput')?.value?.trim();
  if (!query) return;

  setLoading(['mlResults', 'ebayResults', 'cexResults', 'digitalResults'], '🔍 Buscando…');

  const rates = await getRates();
  updateRatesBanner(rates);

  const run = async (fn, resultId, color, currency = 'MXN', opts = {}) => {
    try {
      const raw = await fn();
      const isObj = raw && !Array.isArray(raw) && raw.items;
      let items = isObj ? raw.items : raw;
      let cur = (isObj && raw.currency) ? raw.currency : currency;
      const note = (isObj && opts.fallbackKey && raw[opts.fallbackKey]) ? raw[opts.fallbackKey] : null;
      if (rates && (cur === 'USD' || cur === 'GBP') && items && items.length) {
        items = convertToMxn(items, cur, rates);
        cur = 'MXN';
      }
      setResults(resultId, items, color, cur, note);
    } catch (e) {
      const msg = e.message || 'Error';
      if (opts.blockedUi && (msg.includes('PolicyAgent') || msg === 'NO_CREDENTIALS' || msg.includes('CEX') || msg.includes('bloqueó'))) {
        if (msg === 'NO_CREDENTIALS') {
          setBlocked(resultId, '⚠️ ML sin configurar', 'Añade ML_CLIENT_ID y ML_CLIENT_SECRET en Vercel → Settings → Environment Variables.', null, null);
        } else if (msg.includes('PolicyAgent') || msg.includes('mercadolibre')) {
          setBlocked(resultId, '⚠️ Mercado Libre no disponible', 'La API de búsqueda está restringida (PolicyAgent). Busca en mercadolibre.com.mx.', 'https://www.mercadolibre.com.mx/', 'mercadolibre.com.mx');
        } else if (resultId === 'cexResults') {
          var cexSearchUrl = 'https://mx.webuy.com/search/?stext=' + encodeURIComponent(query);
          setBlocked(resultId, '⚠️ CEX no disponible', 'La API devuelve 403 (serverless y navegador). Busca directamente en CEX:', cexSearchUrl, 'Buscar «' + query + '» en mx.webuy.com');
        } else {
          setBlocked(resultId, '⚠️ Fuente no disponible', msg, null, null);
        }
      } else {
        setError(resultId, msg);
      }
    }
  };

  // ML (ya MXN)
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

  // eBay (USD → MXN si hay tipo de cambio)
  run(async () => fetchApi(API.ebay, query, 'query'), 'ebayResults', 'border-green-500', 'USD');

  // --- BÚSQUEDA EN CEX (Webuy) ---
const cexDiv = document.getElementById('cexResults'); // Cambiado de mlResults a cexResults
cexDiv.innerHTML = "<p style='color: #ff6600; font-weight: bold;'>⚡ Escaneando CeX México/UK...</p>";

fetch(`/api/cex?query=${encodeURIComponent(query)}`)
    .then(res => {
        // Si la API responde con error 403 o similar, lanzamos un error para ir al catch
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
    })
    .then(productos => {
        // Validamos que sea un array y tenga contenido
        if (Array.isArray(productos) && productos.length > 0) {
            cexDiv.innerHTML = productos.map(item => `
                <div style="background: #111827; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #f97316; margin-bottom: 12px; display: flex; gap: 12px; align-items: center;">
                    <img src="${item.image}" style="width: 65px; height: 65px; border-radius: 4px; object-fit: contain; background: white;" alt="Juego">
                    <div style="flex: 1;">
                        <p style="font-size: 0.75rem; color: #9ca3af; margin: 0; text-transform: uppercase;">${item.category}</p>
                        <h4 style="font-size: 0.85rem; color: #f3f4f6; margin: 2px 0; line-height: 1.2;">${item.title}</h4>
                        <div style="display: flex; align-items: baseline; gap: 8px;">
                            <p style="font-size: 1.1rem; color: #f97316; font-weight: bold; margin: 0;">$${item.price.toLocaleString()} ${item.currency}</p>
                        </div>
                        <a href="${item.url}" target="_blank" style="color: #6366f1; font-size: 0.75rem; text-decoration: none; font-weight: bold;">Ver en CeX ↗</a>
                    </div>
                </div>
            `).join('');
        } else {
            // Si no hay resultados, mostramos el botón manual
            mostrarFallbackCex(cexDiv, query);
        }
    })
    .catch(error => {
        console.error("Error en CeX:", error);
        mostrarFallbackCex(cexDiv, query);
    });

// Función auxiliar para no repetir código
function mostrarFallbackCex(container, query) {
    container.innerHTML = `
        <div style="background: rgba(249, 115, 22, 0.1); border: 1px solid #f97316; padding: 1rem; border-radius: 0.5rem;">
            <p style="color: #f97316; font-weight: bold; margin-bottom: 5px;">⚠️ CeX no disponible</p>
            <p style="font-size: 0.75rem; color: #9ca3af; margin-bottom: 10px;">La API está bloqueada temporalmente. Intenta la búsqueda directa:</p>
            <a href="https://mexico.webuy.com/search?stext=${encodeURIComponent(query)}" 
               target="_blank" 
               style="display: inline-block; background: #f97316; color: black; padding: 6px 12px; border-radius: 4px; font-weight: bold; text-decoration: none; font-size: 0.8rem;">
               Buscar "${query}" en mx.webuy.com ↗
            </a>
        </div>`;
}
