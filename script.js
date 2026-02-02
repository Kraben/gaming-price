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

// Ejemplo de item compacto para ver más resultados en pantalla
function renderItem(item) {
  return `
    <div class="flex items-center gap-2 p-1 border-b border-gray-800 hover:bg-gray-900 transition-colors">
        <img src="${item.thumbnail}" class="w-8 h-8 object-contain bg-white rounded">
        <div class="flex-1 min-w-0">
            <p class="text-[10px] font-bold truncate">${item.title}</p>
            <p class="text-[9px] text-yellow-500">$${item.price} MXN</p>
        </div>
        <a href="${item.permalink}" target="_blank" class="text-[9px] bg-blue-600 px-2 py-1 rounded-sm font-black">IR</a>
    </div>`;
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

      // Si la API devuelve error o estructura inesperada, evitamos el crash
      if (data.error || !data) throw new Error(data.error || 'Invalid Data');

      let rawItems = data.results || (Array.isArray(data) ? data : []);

      let items = rawItems.filter(item => {
        const p = Number(item.price);
        const t = item.title.toLowerCase();

        // Filtro de basura
        const palabrasProhibidas = [
          'arete', 'stainless steel', 'acero inoxidable',
          'novel', 'libro', 'facts', 'biografía',
          'playera', 'camisa', 't-shirt', 'póster', 'guía', 'pendant',
          'figura', 'peluche', 'juguete', 'muñeco', 'funko', 'amiibo'
        ];
        const esBasura = palabrasProhibidas.some(palabra => t.includes(palabra));

        // Filtramos precio > 0 (evitar items agotados o sin precio)
        if (p <= 0 || esBasura) return false;

        // FILTRO DE RELEVANCIA:
        // El título debe contener al menos una palabra clave de la búsqueda (ignorando palabras comunes/plataformas)
        // Esto evita que salgan "Uncharted" o "Hogwarts" cuando buscas "God of War"
        const queryClean = document.getElementById('gameInput').value.toLowerCase();
        const ignoreWords = ['ps4', 'ps5', 'xbox', 'switch', 'nintendo', 'sony', 'microsoft', 'edition', 'juego', 'game', 'de', 'el', 'la', 'the', 'of', 'for', 'para', 'and', 'y'];
        const queryTerms = queryClean.split(/\s+/)
          .map(w => w.replace(/[^a-z0-9]/g, '')) // Limpiar caracteres
          .filter(w => w.length > 2 && !ignoreWords.includes(w));

        if (queryTerms.length > 0) {
          // MODO ESTRICTO: Todas las palabras clave deben estar presentes
          // Esto asegura que "God of War" no muestre "Gears of War" (solo coincidiría "War")
          // ni "Hogwarts" (que no debería coincidir nada, pero esto asegura limpieza total).
          const hasMatch = queryTerms.every(term => t.includes(term));

          if (!hasMatch) {
            // console.log(`❌ Filtrado por irrelevante: "${item.title}"`);
            return false;
          }
        }

        return true;
      });

      if (items.length === 0) throw new Error("EMPTY");

      if (rates && (currency === 'USD' || currency === 'GBP')) {
        const rate = (currency === 'USD') ? rates.usd : rates.gbp;
        items = items.map(it => ({ ...it, price: it.price * rate }));
      }

      items.sort((a, b) => a.price - b.price);

      // Limitamos a 6 resultados
      document.getElementById(resultId).innerHTML = items.slice(0, 6).map(it => renderItem(it, color)).join('');

    } catch (e) {
      console.error(`Error en ${resultId}:`, e);
      // Enlaces de respaldo
      const links = {
        amazonResults: `https://www.amazon.com.mx/s?k=${encodeURIComponent(query)}&i=videogames`,
        mlResults: `https://listado.mercadolibre.com.mx/${encodeURIComponent(query)}`,
        ebayResults: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`,
        cexResults: `https://mx.webuy.com/search?stext=${encodeURIComponent(query)}`,
        digitalResults: `https://www.cheapshark.com/search#q:${encodeURIComponent(query)}`
      };
      setBlocked(resultId, 'Acceso Limitado', 'Intenta la búsqueda directa:', links[resultId] || '#', 'BUSCAR MANUALMENTE');
    }
  };

  // EJECUCIÓN DE LAS APIS
  run(() => fetch(`${API.amazon}?query=${query}`).then(r => r.json()), 'amazonResults', 'border-yellow-700');
  run(() => fetch(`${API.ml}?query=${query}`).then(r => r.json()), 'mlResults', 'border-yellow-500');
  run(() => fetch(`${API.ebay}?query=${query}`).then(r => r.json()), 'ebayResults', 'border-green-600', 'USD');
  run(() => fetch(`${API.cex}?query=${query}`).then(r => r.json()), 'cexResults', 'border-orange-500');

  run(() => fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}`)
    .then(r => r.json())
    .then(d => d.map(x => ({
      title: x.external,
      price: x.cheapest,
      thumbnail: x.thumb,
      permalink: `https://www.cheapshark.com/search#q:${encodeURIComponent(x.external)}`
    }))), 'digitalResults', 'border-blue-500', 'USD');
}

// EVENTOS FINALES
document.getElementById('searchBtn').onclick = buscar;
document.getElementById('gameInput').onkeypress = (e) => { if (e.key === 'Enter') buscar(); };
