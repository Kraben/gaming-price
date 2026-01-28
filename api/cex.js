// Vercel Serverless Function para CEX / Webuy
// Sigue la documentación oficial: https://github.com/Dionakra/webuy-api
// Base: https://wss2.cex.${COUNTRY_CODE}.webuy.io/v3 — Search: /boxes?q=...&firstRecord=1&count=20&sortBy=relevance&sortOrder=desc

var REGIONS = {
  uk: { base: 'https://wss2.cex.uk.webuy.io/v3', currency: 'GBP', link: 'https://uk.webuy.com/product-detail?id=' },
  mx: { base: 'https://wss2.cex.mx.webuy.io/v3', currency: 'MXN', link: 'https://mexico.webuy.com/product-detail?id=' }
};

function searchUrl(region, query) {
  return region.base + '/boxes?q=' + encodeURIComponent(query) + '&firstRecord=1&count=20&sortBy=relevance&sortOrder=desc';
}

function parseBoxes(data) {
  var boxes = (data.response && data.response.data && data.response.data.boxes) || data.boxes || [];
  return boxes;
}

function toItems(boxes, region) {
  return boxes.map(function (item) {
    var imgs = item.imageUrls || {};
    return {
      id: item.boxId,
      title: item.boxName,
      price: item.sellPrice,
      exchange: item.exchangePrice,
      currency: region.currency,
      thumbnail: (imgs.medium != null) ? imgs.medium : '',
      permalink: region.link + item.boxId
    };
  });
}

function fetchCex(region, query) {
  var url = searchUrl(region, query);
  return fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    }
  });
}

module.exports = async function handler(req, res) {
  var query = req.query && req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Parámetro "query" es requerido' });
  }

  try {
    // Probar UK primero (todos los ejemplos de la doc usan UK); si 403, probar MX
    var response = await fetchCex(REGIONS.uk, query);

    if (response.ok) {
      var data = await response.json();
      var boxes = parseBoxes(data);
      var items = toItems(boxes, REGIONS.uk);
      return res.status(200).json({
        success: true,
        results: items,
        total: items.length,
        currency: 'GBP',
        source: 'cex_uk',
        fallback: null
      });
    }

    if (response.status === 403) {
      var mxRes = await fetchCex(REGIONS.mx, query);
      if (mxRes.ok) {
        var mxData = await mxRes.json();
        var mxBoxes = parseBoxes(mxData);
        var mxItems = toItems(mxBoxes, REGIONS.mx);
        return res.status(200).json({
          success: true,
          results: mxItems,
          total: mxItems.length,
          currency: 'MXN',
          source: 'cex_mx',
          fallback: 'CEX UK respondió 403; resultados de CEX México.'
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
