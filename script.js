// ⚠️ SECURITY NOTE: Las credenciales ahora están en el backend (backend-server.js)
// ⚠️ BACKEND: Usa el backend server que evita el bloqueo de PolicyAgent de Mercado Libre

// Configuración del backend
const USE_BACKEND = true; // Usar backend propio (recomendado)
const BACKEND_URL = 'http://localhost:3001';

// Configuración legacy (solo si USE_BACKEND = false)
const USE_LOCAL_PROXY = false;
const LOCAL_PROXY = 'http://localhost:3000/proxy?url=';
const PUBLIC_PROXY = 'https://api.allorigins.win/raw?url=';

async function buscar() {
  const query = document.getElementById('gameInput').value.trim();
  if (!query) return;

  const mlDiv = document.getElementById('mlResults');
  const digDiv = document.getElementById('digitalResults');

  mlDiv.innerHTML = "<p style='color:#eab308'>🔍 Buscando en Mercado Libre...</p>";
  digDiv.innerHTML = "<p style='color:#60a5fa'>🔍 Buscando en PC Digital...</p>";

  // Búsquedas independientes: si una falla, la otra continúa
  const [mlResult, digResult] = await Promise.allSettled([
    buscarMercadoLibre(query),
    buscarDigital(query)
  ]);

  // Procesar resultado de Mercado Libre
  if (mlResult.status === 'fulfilled') {
    const dataML = mlResult.value;
    if (dataML.results && dataML.results.length > 0) {
      mlDiv.innerHTML = dataML.results.slice(0, 6).map(item => `
        <div style="background:#1a1a1a; padding:12px; margin-bottom:10px; border-radius:8px; border-left:4px solid #eab308; display:flex; gap:12px; align-items:center;">
          <img src="${item.thumbnail}" alt="${item.title}" style="width:45px; height:45px; object-fit:contain; background:white; border-radius:4px;">
          <div style="flex:1; overflow:hidden;">
            <div style="font-size:11px; color:#ddd; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.title)}</div>
            <div style="font-size:18px; color:#eab308; font-weight:900;">$${item.price.toLocaleString('es-MX')} MXN</div>
          </div>
        </div>`).join('');
    } else {
      mlDiv.innerHTML = "<p style='color:#9ca3af; text-align:center; padding:20px;'>❌ Sin resultados físicos en Mercado Libre.</p>";
    }
  } else {
    const error = mlResult.reason;
    const msg = error?.message || 'Error desconocido';
    const is403 = error?.status === 403 || 
                  error?.blocked_by === 'PolicyAgent' || 
                  /403|ML_403_POLICY|PolicyAgent/i.test(msg);
    
    if (is403) {
      mlDiv.innerHTML = `
        <div style="color:#fbbf24; background:rgba(251,191,36,0.1); padding:15px; border-radius:8px; border-left:4px solid #fbbf24;">
          <div style="font-size:16px; font-weight:bold; margin-bottom:8px; color:#fbbf24;">
            ⚠️ Mercado Libre bloqueado
          </div>
          <div style="font-size:13px; color:#d1d5db; line-height:1.6; margin-bottom:10px;">
            <strong>¿Por qué no hay resultados?</strong><br>
            Mercado Libre está bloqueando la API de búsqueda pública con "PolicyAgent". 
            Esto significa que no podemos obtener resultados de búsqueda de productos físicos en este momento.
          </div>
          <div style="font-size:12px; color:#9ca3af; padding-top:10px; border-top:1px solid rgba(251,191,36,0.2);">
            💡 <strong>Solución temporal:</strong> Puedes buscar manualmente en 
            <a href="https://www.mercadolibre.com.mx/" target="_blank" style="color:#60a5fa; text-decoration:underline;">mercadolibre.com.mx</a>
          </div>
          <div style="color:#60a5fa; margin-top:12px; padding-top:10px; border-top:1px solid rgba(96,165,250,0.2);">
            ✅ <strong>Los precios digitales (PC) siguen funcionando normalmente</strong>
          </div>
        </div>
      `;
    } else {
      mlDiv.innerHTML = `<div style="color:#f87171; background:rgba(255,0,0,0.1); padding:10px; border-radius:5px; border:1px solid #ef4444;">⚠️ Error ML: ${escapeHtml(msg)}</div>`;
    }
  }

  // Procesar resultado Digital
  if (digResult.status === 'fulfilled') {
    const dataDig = digResult.value;
    if (Array.isArray(dataDig) && dataDig.length > 0) {
      digDiv.innerHTML = dataDig.slice(0, 6).map(item => `
        <div style="background:#1a1a1a; padding:12px; margin-bottom:10px; border-radius:8px; border-left:4px solid #60a5fa;">
          <div style="font-size:11px; color:#ddd; font-weight:bold; margin-bottom:4px;">${escapeHtml(item.external || 'Sin nombre')}</div>
          <div style="font-size:18px; color:#60a5fa; font-weight:900;">$${item.cheapest || 'N/A'} USD</div>
        </div>`).join('');
    } else {
      digDiv.innerHTML = "<p style='color:#9ca3af; text-align:center; padding:20px;'>❌ Sin resultados digitales en CheapShark.</p>";
    }
  } else {
    digDiv.innerHTML = `<div style="color:#f87171; background:rgba(255,0,0,0.1); padding:10px; border-radius:5px; border:1px solid #ef4444;">⚠️ Error Digital: ${escapeHtml(digResult.reason?.message || 'Error desconocido')}</div>`;
  }
}

async function buscarMercadoLibre(query) {
  // Usar backend propio (recomendado - evita bloqueo de PolicyAgent)
  if (USE_BACKEND) {
    try {
      console.log('🔄 Buscando a través del backend...');
      const response = await fetch(`${BACKEND_URL}/api/mercadolibre/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Sin detalles');
        let errorData = { status: response.status };
        try {
          errorData = JSON.parse(errorText);
        } catch (_) {}
        
        // Si es 403 o PolicyAgent, lanzar error especial que será detectado por el UI
        if (response.status === 403 || errorData.blocked_by === 'PolicyAgent') {
          const specialError = new Error('ML_403_POLICY_BLOCKED');
          specialError.status = 403;
          specialError.blocked_by = errorData.blocked_by || 'PolicyAgent';
          throw specialError;
        }
        
        throw new Error(`Error del backend (${response.status}): ${errorText.substring(0, 200)}`);
      }
      
      const data = await response.json();
      console.log('✅ Búsqueda exitosa a través del backend');
      return data;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error(
          `❌ No se puede conectar al backend.\n\n` +
          `Solución:\n` +
          `1. Asegúrate de que el backend esté corriendo:\n` +
          `   node backend-server.js\n` +
          `2. Verifica que el puerto ${BACKEND_URL.split(':')[2]} esté disponible\n` +
          `3. O cambia USE_BACKEND = false en script.js para usar método alternativo`
        );
      }
      throw error;
    }
  }
  
  // Método legacy (solo si USE_BACKEND = false)
  // Este método puede fallar por CORS o bloqueo de PolicyAgent
  throw new Error(
    'Backend no configurado. Por favor:\n' +
    '1. Ejecuta: node backend-server.js\n' +
    '2. O cambia USE_BACKEND = true en script.js'
  );
}

async function buscarDigital(query) {
  const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(query)}`);
  
  if (!res.ok) {
    throw new Error(`Error en CheapShark: ${res.status}`);
  }

  return await res.json();
}

// Utilidad para escapar HTML (prevenir XSS)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
document.getElementById('searchBtn').onclick = buscar;
document.getElementById('gameInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    buscar();
  }
});
