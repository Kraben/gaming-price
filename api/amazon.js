// api/amazon.js
module.exports = async function handler(req, res) {
  const { query } = req.query;
  const API_KEY = process.env.RAINFOREST_KEY;

  if (!query) return res.status(400).json({ error: 'Query requerida' });
  if (!API_KEY) return res.status(500).json({ error: 'Falta RAINFOREST_KEY en Vercel' });

  // Endpoint configurado para Amazon México y Videojuegos
  const url = `https://api.rainforestapi.com/request?api_key=${API_KEY}&type=search&amazon_domain=amazon.com.mx&search_term=${encodeURIComponent(query)}&category_id=videogames`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.search_results) {
      return res.status(200).json({ success: true, results: [] });
    }

    const items = data.search_results.map(item => {
      let finalPrice = 0;
      
      // Lógica para extraer el precio real del JSON de Rainforest
      if (item.price && item.price.value) {
        finalPrice = item.price.value;
      } else if (item.offers && item.offers.primary && item.offers.primary.price) {
        finalPrice = item.offers.primary.price.value;
      }

      return {
        title: item.title,
        price: finalPrice,
        thumbnail: item.image,
        permalink: item.link,
        currency: 'MXN'
      };
    })
    // FILTRO CRÍTICO: No enviamos productos de $0 al frontend
    .filter(item => item.price > 0);

    // Enviamos el objeto con la propiedad "results" para que script.js lo reconozca
    return res.status(200).json({ success: true, results: items });

  } catch (e) {
    return res.status(500).json({ error: 'Error de conexión con Rainforest', message: e.message });
  }
};
