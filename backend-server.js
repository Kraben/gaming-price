// Backend Server para Gaming Price MX
// Este servidor hace las requests directamente a Mercado Libre (sin pasar por proxy)
// Evita el bloqueo de PolicyAgent de Mercado Libre
// Run with: node backend-server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3001;

// Habilitar CORS para el frontend
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (frontend)
app.use(express.static(__dirname));

// Importar handlers de la carpeta api/
const mercadoLibreHandler = require('./api/mercadolibre');
const amazonHandler = require('./api/amazon');
const ebayHandler = require('./api/ebay');
const cexHandler = require('./api/cex');

// Adaptador para handlers de Vercel (que esperan req, res) a Express
const adapter = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Error en handler:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};

// Rutas de API
app.get('/api/mercadolibre', adapter(mercadoLibreHandler));
app.get('/api/amazon', adapter(amazonHandler));
app.get('/api/ebay', adapter(ebayHandler));
app.get('/api/cex', adapter(cexHandler));

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
