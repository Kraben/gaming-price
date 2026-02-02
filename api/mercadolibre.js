// Vercel Serverless Function para Mercado Libre API
// Variables: ML_CLIENT_ID, ML_CLIENT_SECRET

module.exports = async function handler(req, res) {
  const { query } = req.query;
  const CLIENT_ID = process.env.ML_CLIENT_ID;
  const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

  if (!query) {
    return res.status(400).json({ error: 'Parámetro "query" es requerido' });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({
      error: 'Credenciales de Mercado Libre no configuradas. Verifica ML_CLIENT_ID y ML_CLIENT_SECRET en Vercel.',
      code: 'NO_CREDENTIALS'
    });
  }

  try {
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'GamingPriceMX/1.0 (Price comparison)'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return res.status(tokenRes.status).json({
        error: 'Error obteniendo token OAuth',
        details: errorText.substring(0, 200)
      });
    }

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(500).json({
        error: 'No se pudo obtener el token de Mercado Libre',
        response: tokenData
      });
    }

    const searchUrl = 'https://api.mercadolibre.com/sites/MLM/search?q=' + encodeURIComponent(query) + '&limit=6';
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + tokenData.access_token,
        'Accept': 'application/json',
        'User-Agent': 'GamingPriceMX/1.0 (Price comparison)'
      }
    });

    if (!searchRes.ok) {
      let errorData = {};
      try {
        errorData = await searchRes.json();
      } catch (_) {
        errorData = { message: await searchRes.text() };
      }

      console.error('❌ Error ML:', JSON.stringify(errorData, null, 2));

      if (searchRes.status === 403 && errorData.blocked_by === 'PolicyAgent') {
        return res.status(403).json({
          error: 'Mercado Libre bloqueó la búsqueda (PolicyAgent)',
          blocked_by: 'PolicyAgent',
          message: 'La API de búsqueda está restringida por Mercado Libre. No hay solución conocida.',
          status: 403,
          code: 'POLICY_AGENT',
          details: errorData
        });
      }
      return res.status(searchRes.status).json({
        error: 'Error en búsqueda de Mercado Libre',
        status: searchRes.status,
        details: errorData
      });
    }

    const data = await searchRes.json();
    if (data.results && data.results.length > 0) {
      const items = data.results.map(function (item) {
        return {
          id: item.id,
          title: item.title,
          price: item.price,
          currency: item.currency_id,
          thumbnail: item.thumbnail,
          permalink: item.permalink,
          condition: item.condition,
          shipping: { free_shipping: (item.shipping && item.shipping.free_shipping) || false }
        };
      });
      return res.status(200).json({ success: true, results: items, total: (data.paging && data.paging.total) || items.length });
    }
    return res.status(200).json({ success: true, results: [], total: 0 });
  } catch (error) {
    console.error('Error en API Mercado Libre:', error);
    const msg = error.message || 'Error interno';
    return res.status(500).json({ error: msg, message: msg, code: 'ML_ERROR' });
  }
};
