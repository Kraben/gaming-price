// Vercel Serverless Function para eBay API
// Variables en Vercel Settings: EBAY_APP_ID, EBAY_CERT_ID

module.exports = async function handler(req, res) {
  const { query } = req.query;
  const CLIENT_ID = process.env.EBAY_APP_ID;
  const CLIENT_SECRET = process.env.EBAY_CERT_ID;

  if (!query) {
    return res.status(400).json({ error: 'Parámetro "query" es requerido' });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Credenciales de eBay no configuradas. Verifica EBAY_APP_ID y EBAY_CERT_ID en Vercel.'
    });
  }

  try {
    // 1. Obtención del Token OAuth
    const auth = Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64');
    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + auth
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({
        error: 'No se pudo obtener el token de eBay',
        details: tokenData
      });
    }

    // 2. Búsqueda filtrada por categoría 1249 (Video Games & Consoles)
    // Usamos limit=15 para tener margen y luego ordenar en el frontend
    const categoryId = "1249"; 
    const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&category_ids=${categoryId}&limit=15`;
    
    const ebayRes = await fetch(searchUrl, {
      headers: { 
        'Authorization': 'Bearer ' + tokenData.access_token,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    });

    if (!ebayRes.ok) {
      const errText = await ebayRes.text();
      return res.status(ebayRes.status).json({
        error: 'Error en búsqueda eBay',
        status: ebayRes.status,
        details: errText.substring(0, 200)
      });
    }

    // 3. Procesamiento y Normalización de Resultados
    const data = await ebayRes.json();
    const summaries = data.itemSummaries || [];
    
    const items = summaries.map(function (item) {
      const p = item.price || {};
      return {
        id: item.itemId,
        title: item.title,
        price: parseFloat(p.value) || 0, // Convertimos a número para facilitar el sorteo
        currency: p.currency || 'USD',
        thumbnail: (item.image && item.image.imageUrl) || '',
        permalink: item.itemWebUrl || 'https://www.ebay.com/itm/' + item.itemId,
        condition: item.condition
      };
    });

    // Devolvemos el objeto con la propiedad "results" que busca tu script.js
    return res.status(200).json({ 
      success: true, 
      results: items, 
      total: items.length 
    });

  } catch (error) {
    console.error('Error en API eBay:', error);
    return res.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
};
