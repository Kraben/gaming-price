// api/amazon.js
module.exports = async function handler(req, res) {
  const { query } = req.query;
  const API_KEY = process.env.RAINFOREST_KEY;

  if (!query) return res.status(400).json({ error: 'Query requerida' });

  // URL con categoría forzada de Videojuegos para MX
  const url = `https://api.rainforestapi.com/request?api_key=${API_KEY}&type=search&amazon_domain=amazon.com.mx&search_term=${encodeURIComponent(query)}&category_id=9263797011`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.search_results) return res.status(200).json({ success: true, results: [] });

    const items = data.search_results.map(item => ({
      title: item.title,
      price: item.price?.value || item.offers?.primary?.price?.value || 0,
      thumbnail: item.image,
      permalink: item.link
    })).filter(item => item.price > 0); // Filtra los que no tienen oferta activa

    return res.status(200).json({ success: true, results: items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
