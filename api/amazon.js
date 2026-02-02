module.exports = async function handler(req, res) {
  const { query } = req.query;
  const API_KEY = process.env.RAINFOREST_KEY;

  if (!query) return res.status(400).json({ error: 'Query requerida' });
  const url = `https://api.rainforestapi.com/request?api_key=${process.env.RAINFOREST_KEY}&type=search&amazon_domain=amazon.com.mx&search_term=${encodeURIComponent(query)}&category_id=10049977011`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Log para depuración
    console.log('Amazon Response Keys:', Object.keys(data));

    // Rainforest API devuelve 'search_results' para búsquedas, 'bestsellers' para bestsellers
    const results = data.search_results || data.bestsellers;

    if (!results) {
      console.warn('⚠️ No Amazon results found in response:', JSON.stringify(data).substring(0, 200));
      return res.status(200).json({ success: true, results: [] });
    }

    // Mapeamos los resultados básicos
    const items = results.map(item => {
      // Intentamos extraer el precio de varias ubicaciones posibles en la respuesta de Rainforest
      let price = item.price?.value;

      if (!price && item.buybox_winner?.price?.value) {
        price = item.buybox_winner.price.value;
      }

      if (!price && item.offers && item.offers.length > 0) {
        price = item.offers[0].price?.value;
      }

      // Si sigue siendo 0 o undefined, lo dejamos en 0 pero lo logueamos para depurar
      if (!price) {
        console.warn(`⚠️ Amazon item sin precio: ${item.title.substring(0, 30)}...`);
        console.log('🔍 Estructura del item:', JSON.stringify(item, null, 2));
      }

      return {
        title: item.title,
        price: price || 0,
        thumbnail: item.image,
        permalink: item.link
      };
    });

    return res.status(200).json({ success: true, results: items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
