module.exports = async function handler(req, res) {
  const { query } = req.query;
  const API_KEY = process.env.RAINFOREST_KEY;

  if (!query) return res.status(400).json({ error: 'Query requerida' });
  const url = `https://api.rainforestapi.com/categories?api_key=${API_KEY}&domain=amazon.com.mx&type=bestsellers&parent_id=bestsellers_videogames`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.bestsellers) return res.status(200).json({ success: true, results: [] });

    // Mapeamos los resultados básicos
    const items = data.bestsellers.map(item => ({
      title: item.title,
      price: item.price?.value || item.offers?.primary?.price?.value || 0,
      thumbnail: item.image,
      permalink: item.link
    }));

    return res.status(200).json({ success: true, results: items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
