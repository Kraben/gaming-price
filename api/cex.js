// Vercel Serverless Function para CEX / Webuy México
// No requiere variables de entorno

var BASE_URL = 'https://wss2.cex.mx.webuy.io/v3';

module.exports = async function handler(req, res) {
  var query = req.query && req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Parámetro "query" es requerido' });
  }

  try {
    var url = BASE_URL + '/boxes?q=' + encodeURIComponent(query) + '&firstRecord=1&count=20';
    var response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'es-MX,es;q=0.9',
        'Referer': 'https://mexico.webuy.com/'
      }
    });

    if (!response.ok) {
      var is403 = response.status === 403;
      return res.status(response.status).json({
        error: is403
          ? 'CEX/Webuy bloqueó la petición (403). Prueba en mexico.webuy.com.'
          : 'Error en búsqueda CEX/Webuy',
        status: response.status,
        blocked: is403
      });
    }

    var data = await response.json();
    var boxes = (data.response && data.response.data && data.response.data.boxes) || [];
    var items = boxes.map(function (item) {
      var imgs = item.imageUrls || {};
      return {
        id: item.boxId,
        title: item.boxName,
        price: item.sellPrice,
        exchange: item.exchangePrice,
        currency: 'MXN',
        thumbnail: imgs.medium || '',
        permalink: 'https://mexico.webuy.com/product-detail?id=' + item.boxId
      };
    });

    return res.status(200).json({ success: true, results: items, total: items.length });
  } catch (error) {
    console.error('Error en API CEX:', error);
    return res.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
};
