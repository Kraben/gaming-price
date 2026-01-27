const CLIENT_ID = '1220538747553444'; 
const CLIENT_SECRET = 'hrLH18SwzJlw4fTnsjy1gauTFYWTu03n'; 
const PROXY = 'https://cors-anywhere.herokuapp.com/'; // <--- ESTA LÍNEA ES VITAL

async function buscar() {
  const query = document.getElementById('gameInput').value;
  if (!query) return;

  const mlDiv = document.getElementById('mlResults');
  const digDiv = document.getElementById('digitalResults');

  mlDiv.innerHTML = "<p style='color:#eab308'>Buscando en México...</p>";
  digDiv.innerHTML = "<p style='color:#60a5fa'>Buscando en PC...</p>";

  try {
    // 1. Obtener Token
    const authRes = await fetch(PROXY + 'https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET 
      }) 
    });

    const authData = await authRes.json();
    if (!authData.access_token) throw new Error("Llaves inactivas. Guarda cambios en el panel de ML.");

    // 2. Búsquedas simultáneas
    const [resML, resDig] = await Promise.all([
      fetch(PROXY + `https://api.mercadolibre.com/sites/MLM/search?q=${query}&limit=6`, {
        headers: { 'Authorization': `Bearer ${authData.access_token}` } 
      }),
      fetch(`https://www.cheapshark.com/api/1.0/games?title=${query}&limit=6`)
    ]);

    const dataML = await resML.json();
    const dataDig = await resDig.json();

    // 3. Renderizar Mercado Libre
    mlDiv.innerHTML = dataML.results.map(item => `
      <div style="background:#1a1a1a; padding:12px; margin-bottom:10px; border-radius:8px; border-left:4px solid #eab308; display:flex; gap:12px; align-items:center;">
        <img src="${item.thumbnail}" style="width:45px; height:45px; object-fit:contain; background:white; border-radius:4px;">
        <div style="flex:1; overflow:hidden;">
          <div style="font-size:11px; color:#ddd; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
          <div style="font-size:18px; color:#eab308; font-weight:900;">$${item.price.toLocaleString('es-MX')} MXN</div>
        </div>
      </div>`).join('') || "Sin resultados físicos.";

    // 4. Renderizar Digital
    digDiv.innerHTML = dataDig.map(item => `
      <div style="background:#1a1a1a; padding:12px; margin-bottom:10px; border-radius:8px; border-left:4px solid #60a5fa;">
        <div style="font-size:11px; color:#ddd; font-weight:bold;">${item.external}</div>
        <div style="font-size:18px; color:#60a5fa; font-weight:900;">$${item.cheapest} USD</div>
      </div>`).join('') || "Sin resultados digitales.";

  } catch (err) {
    mlDiv.innerHTML = `<div style="color:#f87171; background:rgba(255,0,0,0.1); padding:10px; border-radius:5px; border:1px solid #ef4444;">⚠️ Error: ${err.message}</div>`;
  }
}

document.getElementById('searchBtn').onclick = buscar;