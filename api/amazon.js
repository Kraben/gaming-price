// api/amazon.js
module.exports = async function handler(req, res) {
  const { query } = req.query;
  const API_KEY = process.env.RAINFOREST_KEY;

  if (!query) return res.status(400).json({ error: 'Query requerida' });
  if (!API_KEY) return res.status(500).json({ error: 'Falta RAINFOREST_KEY' });

  // Configuramos para Amazon México (amazon.com.mx) y categoría Videojuegos
  const url = `https://api.rainforestapi.com/request?api_key=${API_KEY}&type=search&amazon_domain=amazon.com.mx&search_term=${encodeURIComponent(query)}&category_id=videogames`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.search_results) {
      return res.status(200).json({ results: [] });
    }

    // Normalizamos los datos para tu script.js
    const items = data.search_results.map(item => ({
      title: item.title,
      price: item.price?.value || 0,
      thumbnail: item.image,
      permalink: item.link,
      currency: 'MXN'
    }));

    return res.status(200).json({ results: items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
