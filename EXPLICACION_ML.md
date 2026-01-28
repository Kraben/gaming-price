# ¿Por qué no hay resultados de Mercado Libre?

## Resumen

La **API oficial de búsqueda pública** de Mercado Libre (`/sites/MLM/search`) está **deprecada / bloqueada**: devuelve **403 Forbidden** (PolicyAgent). Usar **proxy propio tampoco suele bastar**: ML detecta y bloquea automáticos más allá del IP. Para comparadores de precios como este, las opciones viables hoy son **búsqueda manual** o **APIs de scraping de pago** (ScrapingBee, Oxylabs, Apify).

---

## 1. Qué pasa con la API oficial

### Endpoint afectado

- `GET /sites/MLM/search?q=...` (y búsquedas por categoría, vendedor, etc.)

Mercado Libre:

- **Deprecó** este endpoint para uso público / Cross-Border Trade (CBT).
- Devuelve **403** con cuerpo tipo `"blocked_by": "PolicyAgent"` en muchas integraciones.
- Documentación actual (ej. [Items & Searches](https://developers.mercadolibre.com.ar/en_us/items-and-searches), [CBT](https://developers.mercadolibre.com.ar/devsite/items-and-searches-global-selling)) indica que hay que migrar a **endpoints autenticados**.

### Endpoints “recomendados” por ML

- `GET /users/{USER_ID}/items/search`
- `GET /marketplace/users/{USER_ID}/items/search`

**Problema para un comparador de precios:**  
Esos endpoints sirven para **buscar ítems de tu propia cuenta de vendedor**. No permiten buscar en el **catálogo público** de ML. Por tanto, **no sustituyen** a `/sites/MLM/search` para mostrar precios de terceros.

---

## 2. Por qué un proxy solo no suele ayudar

En la práctica (y según comentarios en comunidades como [r/devsarg](https://www.reddit.com/r/devsarg/comments/1n8dlfi/api_o_scraping_para_mercado_libre/)):

- **Proxy propio** (VPS, Cloudflare, etc.): muchas veces **sigue dando 403**.
- PolicyAgent y sistemas similares no se basan solo en IP:
  - Comportamiento de las peticiones (headers, patrones, etc.)
  - Rate limiting, fingerprints, etc.

Por eso se suele decir que **“la API de ML ya no funciona ni con proxy”** para búsqueda pública automatizada.

---

## 3. Opciones reales hoy

### A) Búsqueda manual (la que usamos ahora)

- El usuario busca en [mercadolibre.com.mx](https://www.mercadolibre.com.mx/) o [mercadolibre.com.ar](https://www.mercadolibre.com.ar/).
- La app muestra un enlace y un mensaje claro cuando ML no está disponible.
- **Coste:** cero. **Limitación:** no hay resultados de ML dentro de la app.

### B) APIs de scraping de pago

Servicios que usan **proxys rotativos, residenciales y anti-bloqueo** para obtener datos de ML:

| Servicio       | Qué ofrece                               | Enlace / nota |
|----------------|------------------------------------------|----------------|
| **ScrapingBee**| Mercadolibre Scraper API, JS, geotarget  | [scrapingbee.com/scrapers/mercadolibre-api](https://www.scrapingbee.com/scrapers/mercadolibre-api/) – planes desde ~49 USD/mes |
| **Oxylabs**    | Web Scraper API para Mercado Libre/Livre | [oxylabs.io](https://oxylabs.io/products/scraper-api/ecommerce/mercadolibre) – pool de proxies grande |
| **Apify**      | Mercado Libre Product Search Scraper     | [apify.com](https://apify.com/ecomscrape/mercadolibre-product-search-scraper) – ~20 USD/mes + uso |

- **Ventaja:** pueden devolver datos de búsquedas en ML aunque la API oficial esté bloqueada.
- **Desventajas:** coste, cumplir sus ToS y los de Mercado Libre, y posible mantenimiento si ML cambia el HTML.

Si quieres integrar uno de estos, haría falta:

- Crear un backend (o serverless) que llame a la API del proveedor (p. ej. ScrapingBee) con tu API key.
- Transformar su respuesta al formato que ya usa la app (lista de ítems con título, precio, enlace, etc.) y exponer algo como `/api/mercadolibre` que el frontend consuma igual que ahora.

### C) OAuth de usuario (no soluciona búsqueda pública)

- Autenticarse con cuenta ML y usar los endpoints de “mis ítems” **solo** permite buscar en **tu** inventario.
- No da acceso al catálogo público para un comparador genérico. Por eso **no es una alternativa** a `/sites/MLM/search`.

---

## 4. Referencias

- [Reddit r/devsarg – API o scraping para Mercado Libre](https://www.reddit.com/r/devsarg/comments/1n8dlfi/api_o_scraping_para_mercado_libre/)
- [ML Developers – Items & Searches](https://developers.mercadolibre.com.ar/en_us/items-and-searches)
- [ML Developers – Items and searches (CBT)](https://developers.mercadolibre.com.ar/devsite/items-and-searches-global-selling)

---

## 5. Estado en este proyecto

- **ML (API oficial):** no usamos búsqueda pública porque está bloqueada/deprecada; mostramos mensaje claro y enlace a ML.
- **CheapShark (digital):** funciona con normalidad.
- **eBay, CEX, etc.:** según corresponda en la app.

Si en el futuro se integra un **scraper de pago** (ScrapingBee, Oxylabs, Apify), se documentará aquí y en el README.
