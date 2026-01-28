# 🎮 Gamer Price MX

Comparador de precios de videojuegos para México que muestra precios físicos (Mercado Libre) vs digitales (PC).

## ⚠️ IMPORTANTE: Estado de la API de Mercado Libre

**La API de búsqueda pública de Mercado Libre está deprecada/bloqueada (403 PolicyAgent) y NO FUNCIONA.**

- ❌ **Mercado Libre**: `/sites/MLM/search` → 403 Forbidden (PolicyAgent). **Un proxy por sí solo tampoco suele bastar**; ML detecta y bloquea el uso automatizado.
- ✅ **CheapShark**: Precios digitales (Steam, Epic, etc.) — **FUNCIONA**
- ✅ **eBay, CEX**: Según implementación y disponibilidad de las APIs.

**Opciones para datos de ML:** búsqueda manual en mercadolibre.com.mx o **APIs de scraping de pago** (ScrapingBee, Oxylabs, Apify). Detalles y referencias (incl. [Reddit r/devsarg](https://www.reddit.com/r/devsarg/comments/1n8dlfi/api_o_scraping_para_mercado_libre/)) → **[EXPLICACION_ML.md](./EXPLICACION_ML.md)**.

## 🚀 Características

- **Precios Digitales**: ✅ CheapShark (Steam, Epic, etc.) — **FUNCIONA**
- **Precios Físicos**: ✅ eBay, CEX/Webuy (según config); ❌ Mercado Libre — **BLOQUEADO** (ver [EXPLICACION_ML.md](./EXPLICACION_ML.md))
- **Interfaz**: Diseño oscuro, Tailwind CSS, búsqueda en tiempo real

## 📋 Requisitos

- Navegador web moderno
- Acceso a internet
- Credenciales de Mercado Libre API (opcional, para precios físicos)

## 🛠️ Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Kraben/gaming-price.git
cd gaming-price
```

### 2. Configurar Mercado Libre API (Opcional - Actualmente no funciona)

⚠️ **NOTA**: Aunque configures las credenciales, la API de búsqueda está bloqueada por Mercado Libre y no funcionará.

1. Ve a [Mercado Libre Developers](https://developers.mercadolibre.com.mx/)
2. Crea una aplicación y obtén `CLIENT_ID` y `CLIENT_SECRET`
3. Edita `backend-server.js` y reemplaza las credenciales:

```javascript
const ML_CLIENT_ID = 'tu_client_id';
const ML_CLIENT_SECRET = 'tu_client_secret';
```

**Importante**: Incluso con credenciales válidas, Mercado Libre bloquea las búsquedas con error 403 PolicyAgent.

### 3. Instalar Dependencias e Iniciar Backend

⚠️ **Importante**: Aunque el backend está implementado, Mercado Libre bloquea la API de búsqueda.

1. **Instala las dependencias**:
```bash
npm install
```

2. **Inicia el backend server** (opcional, ya que ML está bloqueado):
```bash
npm start
# o
node backend-server.js
```

3. El servidor iniciará en `http://localhost:3001`
4. **Mantén esta terminal abierta** - el backend debe estar corriendo mientras usas la app

**Nota**: El backend maneja las credenciales de forma segura, pero Mercado Libre sigue bloqueando las búsquedas con PolicyAgent (403 Forbidden).

### 4. Ejecutar la Aplicación

**IMPORTANTE**: El backend debe estar corriendo antes de abrir la aplicación.

1. **Abre `index.html`** en tu navegador o usa un servidor local:

```bash
# Con Python
python -m http.server 8000

# Con Node.js (http-server)
npx http-server

# Con PHP
php -S localhost:8000
```

Luego visita `http://localhost:8000`

## 🔒 Seguridad

✅ **Mejorado**: Las credenciales de Mercado Libre ahora están en el backend (`backend-server.js`), no en el frontend.

**Para producción**:
- Usar variables de entorno para las credenciales:
  ```javascript
  const ML_CLIENT_ID = process.env.ML_CLIENT_ID;
  const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
  ```
- Implementar rate limiting en el backend
- Agregar autenticación si es necesario
- Nunca exponer credenciales en el código del cliente

## 📦 APIs Utilizadas

- **Mercado Libre API**: ❌ Bloqueada/deprecada (403 PolicyAgent). Proxy solo no suele bastar. Ver [EXPLICACION_ML.md](./EXPLICACION_ML.md).
- **CheapShark API**: ✅ Precios digitales (Steam, Epic, etc.)
- **eBay**: Según configuración en Vercel (EBAY_APP_ID, EBAY_CERT_ID).
- **CEX / WeBuy**: Implementación según [Dionakra/webuy-api](https://github.com/Dionakra/webuy-api) (Search: `/boxes?q=...&firstRecord=1&count=20&sortBy=relevance&sortOrder=desc`). Probamos UK → MX; si 403, enlace directo a mexico.webuy.com/search.

## 🎨 Tecnologías

- HTML5
- JavaScript (ES6+)
- Tailwind CSS (CDN)

## 📝 Uso

1. Escribe el nombre de un juego en el campo de búsqueda
2. Presiona "BUSCAR" o Enter
3. Verás precios digitales (USD) de CheapShark
4. La sección de Mercado Libre mostrará un mensaje indicando que está bloqueada

**Nota**: Solo los precios digitales funcionan actualmente debido al bloqueo de Mercado Libre.

## 🐛 Problemas Conocidos y Soluciones

### Error: "No se puede conectar al backend"
**Problema**: El backend no está corriendo o el puerto está ocupado.

**Solución**: 
1. Verifica que el backend esté corriendo: `node backend-server.js`
2. Verifica que el puerto 3001 esté disponible
3. Revisa la consola del backend para ver errores

### Error 403 de Mercado Libre (PolicyAgent) - ACTUAL
**Problema**: La API de búsqueda `/sites/MLM/search` está **PERMANENTEMENTE BLOQUEADA** por Mercado Libre con error 403 (PolicyAgent).

**Estado actual**: 
- ❌ **Mercado Libre NO FUNCIONA** - La API está bloqueada y no hay solución conocida
- ✅ **CheapShark FUNCIONA** - Los precios digitales (Steam, Epic, etc.) funcionan perfectamente
- La app muestra un mensaje informativo cuando ML está bloqueado
- Puedes usar la app para comparar precios digitales en PC

**No es un bug del código** — Mercado Libre bloquea las búsquedas automáticas incluso con backend propio, token OAuth, headers correctos o **proxy**. Las alternativas viables son búsqueda manual o **APIs de scraping de pago** (ScrapingBee, Oxylabs, Apify).

Ver **[EXPLICACION_ML.md](./EXPLICACION_ML.md)** para deprecación oficial, por qué un proxy no basta, enlace a Reddit r/devsarg y alternativas (scraping APIs).

### CheapShark sin resultados
- CheapShark puede no tener todos los juegos
- Intenta con nombres más específicos o en inglés

### Mercado Libre sin resultados
- La API pública está bloqueada/deprecada. No es un tema de credenciales ni de proxy local.
- Ver [EXPLICACION_ML.md](./EXPLICACION_ML.md) para alternativas (búsqueda manual, ScrapingBee, Oxylabs, Apify).

## 📄 Licencia

Este proyecto está en desarrollo activo.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request
