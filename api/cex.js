// Vercel Serverless Function para CEX / Webuy México
// No requiere variables de entorno

const BASE_URL = 'https://wss2.cex.mx.webuy.io/v3';

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Parámetro "query" es requerido' });
  }

  try {
    const response = await fetch(
      `${BASE_URL}/boxes?q=${encodeURIComponent(query)}&firstRecord=1&count=20`,
      { headers: { 'User-Agent': 'GamingPriceMX/1.0 (Mozilla/5.0)' } }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Error en búsqueda CEX/Webuy',
        status: response.status
      });
    }

    const data = await response.json();
    const boxes = data.response?.data?.boxes || [];

    const items = boxes.map(item => ({
      id: item.boxId,
      title: item.boxName,
      price: item.sellPrice,
      exchange: item.exchangePrice,
      currency: 'MXN',
      thumbnail: item.imageUrls?.medium || '',
      permalink: `https://mexico.webuy.com/product-detail?id=${item.boxId}`
    }));

    return res.status(200).json({
      success: true,
      results: items,
      total: items.length
    });
  } catch (error) {
    console.error('Error en API CEX:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}
