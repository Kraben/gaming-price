async function buscar() {
  const query = document.getElementById('gameInput')?.value?.trim();
  if (!query) return;

  const ids = ['amazonResults', 'mlResults', 'ebayResults', 'cexResults', 'digitalResults'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<p class="text-gray-500 text-xs italic animate-pulse">Buscando...</p>';
  });

  const rates = await getRates();
  updateRatesBanner(rates);

  // Función de ejecución independiente para que nada se bloquee
  const run = async (fn, resultId, color, currency = 'MXN', opts = {}) => {
    try {
      const data = await fn();
      let items = Array.isArray(data) ? data : (data.results || []);
      
      // Filtramos ceros de Amazon/ML aquí mismo
      items = items.filter(item => Number(item.price) > 0);

      if (items.length === 0) throw new Error("NO_RESULTS");

      if (rates && (currency === 'USD' || currency === 'GBP')) {
        items = convertToMxn(items, currency, rates);
      }
      
      items.sort((a, b) => a.price - b.price);
      document.getElementById(resultId).innerHTML = items.slice(0, 6).map(item => renderItem(item, color, 'MXN')).join('');
      
    } catch (e) {
      // Si falla o no hay resultados, mostramos el botón de auxilio
      const links = {
        amazonResults: `https://www.amazon.com.mx/s?k=${encodeURIComponent(query)}&i=videogames`,
        mlResults: `https://games.mercadolibre.com.mx/${encodeURIComponent(query)}`,
        cexResults: `https://mexico.webuy.com/search?stext=${encodeURIComponent(query)}`,
        ebayResults: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=1249`
      };
      
      setBlocked(resultId, 'Ver opciones manuales', 'No se encontraron ofertas automáticas con precio.', links[resultId] || '#', 'BUSCAR EN TIENDA ↗');
    }
  };

  // Ejecución en paralelo: Amazon y ML primero
  run(async () => {
    const r = await fetch(`${API.amazon}?query=${encodeURIComponent(query)}`);
    return await r.json();
  }, 'amazonResults', 'border-yellow-700', 'MXN');

  run(async () => {
    const r = await fetch(`${API.ml}?query=${encodeURIComponent(query)}`);
    return await r.json();
  }, 'mlResults', 'border-yellow-500', 'MXN');

  run(async () => {
    const r = await fetch(`${API.ebay}?query=${encodeURIComponent(query)}`);
    return await r.json();
  }, 'ebayResults', 'border-green-600', 'USD');

  run(async () => {
    const r = await fetch(`${API.cex}?query=${encodeURIComponent(query)}`);
    if(!r.ok) throw new Error();
    return await r.json();
  }, 'cexResults', 'border-orange-500', 'MXN');

  run(async () => {
    const r = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}`);
    const list = await r.json();
    return list.map(x => ({ title: x.external, price: x.cheapest, thumbnail: x.thumb, permalink: `https://www.cheapshark.com/redirect?dealID=${x.cheapestDealID}` }));
  }, 'digitalResults', 'border-blue-500', 'USD');
}
