// api/amazon.js
module.exports = async function handler(req, res) {
  const { query } = req.query;
  const API_KEY = process.env.RAINFOREST_KEY;

  // URL específica para Videojuegos en Amazon MX
  const url = `https://api.rainforestapi.com/request?api_key=${API_KEY}&type=search&amazon_domain=amazon.com.mx&search_term=${encodeURIComponent(query)}&category_id=9263797011`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const items = (data.search_results || []).map(item => ({
      title: item.title,
      price: item.price?.value || item.offers?.primary?.price?.value || 0,
      thumbnail: item.image,
      permalink: item.link
    }))
    .filter(item => {
      const t = item.title.toLowerCase();
      // FILTRO HUMANO: Eliminamos lo que Amazon mete por error
      const esBasura = t.includes('novel') || t.includes('libro') || t.includes('playera') || t.includes('camisa') || t.includes('póster');
      return item.price > 0 && !esBasura;
    });

    return res.status(200).json({ success: true, results: items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
