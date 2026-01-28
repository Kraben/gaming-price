// api/cex.js - Copia este código íntegro en tu archivo de Vercel
const REGIONS = {
  mx: { 
    base: 'https://wss2.cex.mx.webuy.io/v3', 
    currency: 'MXN', 
    link: 'https://mexico.webuy.com/product-detail?id=',
    origin: 'https://mexico.webuy.com'
  },
  uk: { 
    base: 'https://wss2.cex.uk.webuy.io/v3', 
    currency: 'GBP', 
    link: 'https://uk.webuy.com/product-detail?id=',
    origin: 'https://uk.webuy.com'
  }
};

function toItems(boxes, region) {
  return boxes.map(item => ({
    // Estos nombres coinciden exactamente con lo que busca tu buscar.js
    title: item.boxName,
    price: item.sellPrice,
    exchange: item.exchangePrice,
    image: item.imageUrls?.medium || '', 
    category: item.categoryFriendlyName || 'Videojuego',
    url: region.link + item.boxId,
    currency: region.currency
  }));
}

async function fetchCex(region, query) {
  const url = `${region.base}/boxes?q=${encodeURIComponent(query)}&firstRecord=1&count=20&sortBy=relevance&sortOrder=desc`;
  
  return fetch(url, {
    headers: {
      // Headers para evitar el error 403 Forbidden
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Origin': region.origin,
      'Referer': region.origin + '/'
    }
  });
}

module.exports = async function handler(req, res) {
  const query = req.query?.query;

  if (!query) {
    return res.status(400).json({ error: 'Parámetro "query" requerido' });
  }

  try {
    // Intentamos México primero
    let response = await fetchCex(REGIONS.mx, query);
    let region = REGIONS.mx;

    // Si México falla o está bloqueado, probamos UK como respaldo
    if (!response.ok) {
      response = await fetchCex(REGIONS.uk, query);
      region = REGIONS.uk;
    }

    if (response.ok) {
      const data = await response.json();
      const boxes = data.response?.data?.boxes || data.boxes || [];
      const items = toItems(boxes, region);
      
      // Enviamos el array directamente para que productos.length funcione
      return res.status(200).json(items);
    }

    return res.status(response.status).json({ 
      error: 'API bloqueada o no disponible', 
      status: response.status 
    });

  } catch (error) {
    console.error('Error CEX:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
