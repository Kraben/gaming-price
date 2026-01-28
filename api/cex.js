// api/cex.js
const REGIONS = {
  mx: { base: 'https://wss2.cex.mx.webuy.io/v3', currency: 'MXN', link: 'https://mx.webuy.com/product-detail?id=', origin: 'https://mx.webuy.com' },
  uk: { base: 'https://wss2.cex.uk.webuy.io/v3', currency: 'GBP', link: 'https://uk.webuy.com/product-detail?id=', origin: 'https://uk.webuy.com' }
};

async function fetchCex(region, query) {
  const url = `${region.base}/boxes?q=${encodeURIComponent(query)}&firstRecord=1&count=20&sortBy=relevance&sortOrder=desc`;
  return fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'es-MX,es;q=0.9',
      'Origin': region.origin,
      'Referer': region.origin + '/',
      'Cache-Control': 'no-cache'
    }
  });
}

module.exports = async function handler(req, res) {
  const query = req.query?.query;
  if (!query) return res.status(400).json({ error: 'Query requerida' });

  try {
    // Intentamos México directamente
    let response = await fetchCex(REGIONS.mx, query);
    
    // Si da 403 o falla, intentamos UK solo como último recurso
    if (!response.ok) {
      response = await fetchCex(REGIONS.uk, query);
      var region = REGIONS.uk;
    } else {
      var region = REGIONS.mx;
    }

    if (response.ok) {
      const data = await response.json();
      const boxes = data.response?.data?.boxes || data.boxes || [];
      const items = boxes.map(item => ({
        id: item.boxId,
        title: item.boxName,
        price: item.sellPrice,
        thumbnail: item.imageUrls?.medium || '',
        permalink: region.link + item.boxId,
        currency: region.currency
      }));
      return res.status(200).json(items);
    }

    // Si llegamos aquí, es que ambos dieron 403
    return res.status(403).json({ error: 'Bloqueado por CloudFront', blocked: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
