// api/amazon.js
module.exports = async function handler(req, res) {
  const { query } = req.query;
  const API_KEY = process.env.RAINFOREST_KEY;

  if (!query) return res.status(400).json({ error: 'Query requerida' });
  
  // URL Mejorada con el ID de categoría de Videojuegos para México
  const url = `https://api.rainforestapi.com/request?api_key=${API_KEY}&type=search&amazon_domain=amazon.com.mx&search_term=${encodeURIComponent(query)}&category_id=9263797011`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.search_results) return res.status(200).json({ success: true, results: [] });

    const items = data.search_results.map(item => {
      let finalPrice = 0;
      if (item.price && item.price.value) finalPrice = item.price.value;
      else if (item.offers && item.offers.primary) finalPrice = item.offers.primary.price.value;

      return {
        title: item.title,
        price: finalPrice,
        thumbnail: item.image,
        permalink: item.link,
        currency: 'MXN'
      };
    })
    .filter(item => item.price > 0) // Elimina ocarinas/libros sin precio real
    .slice(0, 8); // Solo los mejores resultados

    return res.status(200).json({ success: true, results: items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
