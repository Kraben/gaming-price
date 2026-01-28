// Vercel Serverless Function para CEX / Webuy México
// Restaurado al estilo original que funcionaba: solo User-Agent Mozilla/5.0, sin Origin/Referer.

var BASE_URL = 'https://wss2.cex.mx.webuy.io/v3';

module.exports = async function handler(req, res) {
  var query = req.query && req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Parámetro "query" es requerido' });
  }

  try {
    var url = BASE_URL + '/boxes?q=' + encodeURIComponent(query) + '&firstRecord=1&count=20';
    var response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: response.status === 403
          ? 'CEX bloqueó la petición (403). Busca en mexico.webuy.com.'
          : 'Error en búsqueda CEX',
        status: response.status,
        blocked: response.status === 403
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

    return res.status(200).json({
      success: true,
      results: items,
      total: items.length,
      currency: 'MXN'
    });
  } catch (error) {
    console.error('Error en API CEX:', error);
    return res.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
};
