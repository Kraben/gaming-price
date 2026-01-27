// Backend Server para Gaming Price MX
// Este servidor hace las requests directamente a Mercado Libre (sin pasar por proxy)
// Evita el bloqueo de PolicyAgent de Mercado Libre
// Run with: node backend-server.js

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3001;

// Habilitar CORS para el frontend
app.use(cors());
app.use(express.json());

// Credenciales de Mercado Libre (en producción, usar variables de entorno)
const ML_CLIENT_ID = '1220538747553444';
const ML_CLIENT_SECRET = 'hrLH18SwzJlw4fTnsjy1gauTFYWTu03n';

// Cache para el token OAuth (evita obtenerlo en cada request)
let tokenCache = {
  token: null,
  expiresAt: null
};

// Función para obtener token OAuth de Mercado Libre
async function getMercadoLibreToken() {
  // Si tenemos un token válido en cache, usarlo
  if (tokenCache.token && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: ML_CLIENT_ID,
      client_secret: ML_CLIENT_SECRET
    }).toString();

    const options = {
      hostname: 'api.mercadolibre.com',
      port: 443,
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            // Cachear el token (expira en expires_in segundos, menos 60 segundos de margen)
            tokenCache.token = response.access_token;
            tokenCache.expiresAt = Date.now() + (response.expires_in - 60) * 1000;
            console.log('✅ Token OAuth obtenido y cacheado');
            resolve(response.access_token);
          } else {
            reject(new Error('No se pudo obtener el token: ' + JSON.stringify(response)));
          }
        } catch (error) {
          reject(new Error('Error parseando respuesta del token: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Endpoint para buscar productos en Mercado Libre
app.get('/api/mercadolibre/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Parámetro "q" (query) es requerido' });
    }

    console.log(`🔍 Búsqueda: "${q}"`);

    // Obtener token OAuth
    const token = await getMercadoLibreToken();

    // Buscar productos
    const searchUrl = `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(q)}&limit=6`;

    return new Promise((resolve, reject) => {
      const path = `/sites/MLM/search?q=${encodeURIComponent(q)}&limit=6`;
      const options = {
        hostname: 'api.mercadolibre.com',
        port: 443,
        path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'User-Agent': 'GamingPriceMX/1.0 (Price comparison; +https://github.com/Kraben/gaming-price)',
          'Accept-Language': 'es-MX,es;q=0.9'
        }
      };

      const req = https.request(options, (searchRes) => {
        let data = '';

        searchRes.on('data', (chunk) => {
          data += chunk;
        });

        searchRes.on('end', () => {
          if (searchRes.statusCode === 200) {
            try {
              const results = JSON.parse(data);
              console.log(`✅ ${results.results?.length || 0} resultados encontrados`);
              res.json(results);
              resolve();
            } catch (error) {
              console.error('❌ Error parseando respuesta:', error);
              res.status(500).json({ error: 'Error parseando respuesta de Mercado Libre' });
              resolve();
            }
          } else {
            let errBody = {};
            try { errBody = JSON.parse(data); } catch (_) {}
            console.error(`❌ Error de Mercado Libre: ${searchRes.statusCode}`, errBody.blocked_by || data.substring(0, 150));
            res.status(searchRes.statusCode).json({ 
              error: 'Error de Mercado Libre',
              status: searchRes.statusCode,
              blocked_by: errBody.blocked_by || null,
              message: errBody.message || data.substring(0, 200)
            });
            resolve();
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Error en request:', error);
        res.status(500).json({ error: error.message });
        resolve();
      });

      req.end();
    });
  } catch (error) {
    console.error('❌ Error en endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta raíz - información del API
app.get('/', (req, res) => {
  res.json({
    service: 'Gaming Price MX Backend',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      search: 'GET /api/mercadolibre/search?q=QUERY',
      health: 'GET /health'
    },
    usage: 'Este backend maneja las requests a Mercado Libre API. Usa el frontend (index.html) para interactuar con la aplicación.'
  });
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Gaming Price MX Backend',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoints disponibles:`);
  console.log(`   GET /api/mercadolibre/search?q=QUERY`);
  console.log(`   GET /health`);
  console.log(`\n💡 El frontend debe usar: const BACKEND_URL = 'http://localhost:${PORT}';`);
});
