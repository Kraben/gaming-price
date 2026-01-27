# 🚀 Quick Start Guide

## Inicio Rápido

### Paso 1: Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará Express y CORS necesarios para el backend.

### Paso 2: Iniciar el Backend

Ejecuta:

```bash
npm start
# o
node backend-server.js
```

Deberías ver:
```
🚀 Backend Server running on http://localhost:3001
📝 Endpoints disponibles:
   GET /api/mercadolibre/search?q=QUERY
   GET /health
```

**¡Mantén esta terminal abierta!** El backend debe estar corriendo mientras usas la aplicación.

### Paso 3: Verificar Configuración

Abre `script.js` y verifica que:
```javascript
const USE_BACKEND = true; // Debe ser true
const BACKEND_URL = 'http://localhost:3001'; // Debe coincidir con el puerto del backend
```

### Paso 4: Abrir la Aplicación

Abre `index.html` en tu navegador (o usa un servidor local):

```bash
# Opción 1: Abrir directamente
# Solo haz doble clic en index.html

# Opción 2: Con servidor local (recomendado)
python -m http.server 8000
# Luego visita: http://localhost:8000
```

### Paso 5: Probar

1. Escribe "Zelda" en el campo de búsqueda
2. Presiona "BUSCAR"
3. Deberías ver resultados de Mercado Libre y CheapShark

## ✅ Verificación

Si todo funciona correctamente:
- ✅ No verás errores 403 en la consola
- ✅ Verás resultados de Mercado Libre (precios físicos)
- ✅ Verás resultados de CheapShark (precios digitales)

## ❌ Si Aún Hay Problemas

### Error: "No se puede conectar al backend"
- Verifica que `backend-server.js` esté corriendo
- Verifica que el puerto 3001 no esté en uso
- Revisa la terminal del backend para ver errores
- Cambia el puerto en `backend-server.js` y actualiza `BACKEND_URL` en `script.js`

### Error: "Failed to fetch" o "ERR_CONNECTION_REFUSED"
- Asegúrate de que `USE_BACKEND = true` en `script.js`
- Verifica que el backend esté corriendo en el puerto correcto
- Reinicia el backend server
- Limpia la caché del navegador

### Sin resultados de Mercado Libre
- Verifica las credenciales API en `backend-server.js`
- Asegúrate de que el backend esté corriendo
- Revisa la consola del backend para ver logs
- Revisa la consola del navegador (F12) para más detalles

### Error 403 de Mercado Libre
- ✅ **Ya resuelto** - El backend propio evita el bloqueo de PolicyAgent
- Si aún ves este error, verifica que estés usando `USE_BACKEND = true`

## 🔄 Alternativa: Extensión del Navegador

Si no quieres usar el proxy local:

1. Instala una extensión CORS (ej: "CORS Unblock" para Chrome)
2. Activa la extensión
3. En `script.js`, cambia: `USE_LOCAL_PROXY = false`
4. La aplicación intentará hacer requests directos (puede funcionar con la extensión)

**Nota**: Esta opción es solo para desarrollo. Para producción, usa el proxy backend.
