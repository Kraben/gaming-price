// Vercel Serverless Function para eBay API
// Variables requeridas en Vercel: EBAY_APP_ID, EBAY_CERT_ID

export default async function handler(req, res) {
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
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
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

    // Búsqueda en categoría videojuegos (139973)
    const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=6&category_ids=139973`;
    const ebayRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    if (!ebayRes.ok) {
      const errText = await ebayRes.text();
      return res.status(ebayRes.status).json({
        error: 'Error en búsqueda eBay',
        status: ebayRes.status,
        details: errText.substring(0, 200)
      });
    }

    const data = await ebayRes.json();
    const summaries = data.itemSummaries || [];

    const items = summaries.map(item => ({
      id: item.itemId,
      title: item.title,
      price: item.price?.value || 0,
      currency: item.price?.currency || 'USD',
      thumbnail: item.image?.imageUrl || '',
      permalink: item.itemWebUrl || `https://www.ebay.com/itm/${item.itemId}`,
      condition: item.condition
    }));

    return res.status(200).json({
      success: true,
      results: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error en API eBay:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}
