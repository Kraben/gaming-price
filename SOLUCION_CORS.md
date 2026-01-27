# 🔧 Solución al Error 403 de Mercado Libre

## Problema

Mercado Libre está bloqueando las requests que vienen a través de proxies con el error:
```
PolicyAgent: "At least one policy returned UNAUTHORIZED"
```

## Soluciones

### Opción 1: Extensión del Navegador (Desarrollo) ⚡ RÁPIDA

1. **Instala una extensión CORS:**
   - Chrome: "CORS Unblock" o "Allow CORS"
   - Firefox: "CORS Everywhere"

2. **Activa la extensión** en tu navegador

3. **Modifica `script.js`:**
   ```javascript
   const USE_LOCAL_PROXY = false; // Cambiar a false
   ```

4. **Recarga la página** - La app intentará requests directos que funcionarán con la extensión

### Opción 2: Backend Propio (Producción) 🏗️ RECOMENDADA

Crea un backend que haga las requests directamente (sin pasar por proxy desde el frontend).

#### Ejemplo con Node.js/Express:

```javascript
// backend-proxy.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/mercadolibre/search', async (req, res) => {
  const { query, token } = req.body;
  
  // Obtener token si no se proporciona
  let accessToken = token;
  if (!accessToken) {
    // Obtener token OAuth aquí
  }
  
  // Hacer request directa a Mercado Libre
  const response = await fetch(
    `https://api.mercadolibre.com/sites/MLM/search?q=${encodeURIComponent(query)}&limit=6`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  res.json(data);
});

app.listen(3001, () => {
  console.log('Backend proxy running on http://localhost:3001');
});
```

Luego en `script.js`, cambia las requests para usar tu backend:
```javascript
const BACKEND_URL = 'http://localhost:3001';
// Usar fetch(BACKEND_URL + '/api/mercadolibre/search', ...)
```

### Opción 3: Servidorless (Vercel/Netlify) ☁️

Crea una función serverless que actúe como proxy:

```javascript
// api/mercadolibre.js (Vercel)
export default async function handler(req, res) {
  const { query } = req.query;
  
  // Obtener token OAuth
  const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET
    })
  });
  
  const { access_token } = await tokenRes.json();
  
  // Buscar productos
  const searchRes = await fetch(
    `https://api.mercadolibre.com/sites/MLM/search?q=${query}&limit=6`,
    {
      headers: { 'Authorization': `Bearer ${access_token}` }
    }
  );
  
  const data = await searchRes.json();
  res.json(data);
}
```

## ¿Por qué Mercado Libre bloquea proxies?

Mercado Libre tiene sistemas de seguridad (PolicyAgent) que detectan y bloquean:
- Requests que vienen a través de proxies públicos
- Patrones sospechosos de tráfico
- Headers que indican uso de proxy

## Recomendación

Para **desarrollo**: Usa la Opción 1 (extensión CORS)
Para **producción**: Usa la Opción 2 o 3 (backend propio)
