// Vercel Serverless Function para CEX / Webuy
// MX a menudo 403 desde serverless; si falla, probar UK como fallback.

var MX = { base: 'https://wss2.cex.mx.webuy.io/v3', currency: 'MXN', link: 'https://mexico.webuy.com/product-detail?id=', id: 'mx' };
var UK = { base: 'https://wss2.cex.uk.webuy.io/v3', currency: 'GBP', link: 'https://uk.webuy.com/product-detail?id=', id: 'uk' };

function searchCEX(query, region) {
  var url = region.base + '/boxes?q=' + encodeURIComponent(query) + '&firstRecord=1&count=20&sortBy=relevance&sortOrder=desc';
  var origin = region.id === 'mx' ? 'https://mx.webuy.com' : 'https://uk.webuy.com';
  return fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Origin': origin,
      'Referer': origin + '/'
    }
  });
}

function toItems(data, region) {
  var boxes = (data.response && data.response.data && data.response.data.boxes) || [];
  return boxes.map(function (item) {
    var imgs = item.imageUrls || {};
    return {
      id: item.boxId,
      title: item.boxName,
      price: item.sellPrice,
      exchange: item.exchangePrice,
      currency: region.currency,
      thumbnail: imgs.medium || '',
      permalink: region.link + item.boxId,
      source: 'cex_' + region.id
    };
  });
}

module.exports = async function handler(req, res) {
  var query = req.query && req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Parámetro "query" es requerido' });
  }

  try {
    var response = await searchCEX(query, MX);

    if (response.ok) {
      var data = await response.json();
      var items = toItems(data, MX);
      return res.status(200).json({ success: true, results: items, total: items.length, source: 'cex_mx', currency: 'MXN' });
    }

    if (response.status === 403) {
      var ukRes = await searchCEX(query, UK);
      if (ukRes.ok) {
        var ukData = await ukRes.json();
        var ukItems = toItems(ukData, UK);
        return res.status(200).json({
          success: true,
          results: ukItems,
          total: ukItems.length,
          source: 'cex_uk',
          currency: 'GBP',
          fallback: 'CEX México bloqueó (403); se muestran resultados de CEX UK.'
        });
      }
    }

    var is403 = response.status === 403;
    return res.status(response.status).json({
      error: is403
        ? 'CEX bloqueó la petición (403). Busca en mexico.webuy.com o uk.webuy.com.'
        : 'Error en búsqueda CEX',
      status: response.status,
      blocked: is403
    });
  } catch (error) {
    console.error('Error en API CEX:', error);
    return res.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
};
