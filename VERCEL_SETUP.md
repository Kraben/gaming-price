# 🚀 Configuración de Vercel para Gaming Price MX

## Fuentes de búsqueda (4)

| Fuente | API | Variables Vercel |
|--------|-----|------------------|
| **Mercado Libre** | `/api/mercadolibre` | `ML_CLIENT_ID`, `ML_CLIENT_SECRET` |
| **eBay** | `/api/ebay` | `EBAY_APP_ID`, `EBAY_CERT_ID` |
| **CEX / Webuy** | `/api/cex` | (ninguna) |
| **CheapShark** (PC digital) | directo | (ninguna) |

## Variables de Entorno Requeridas

En tu proyecto de Vercel → **Settings → Environment Variables**:

| Variable | Descripción |
|----------|-------------|
| `ML_CLIENT_ID` | Client ID de Mercado Libre |
| `ML_CLIENT_SECRET` | Client Secret de Mercado Libre |
| `EBAY_APP_ID` | App ID de eBay |
| `EBAY_CERT_ID` | Cert ID de eBay (OAuth) |

## Cómo Obtener las Credenciales

1. Ve a [Mercado Libre Developers](https://developers.mercadolibre.com.mx/)
2. Crea una aplicación o usa una existente
3. Copia el `CLIENT_ID` y `CLIENT_SECRET`
4. Agrégalos a Vercel como variables de entorno

## Estructura del Proyecto

```
gaming-price/
├── api/
│   └── mercadolibre.js    # Función serverless de Vercel
├── index.html             # Frontend
├── script.js              # Lógica del frontend
└── vercel.json            # Configuración de Vercel
```

## Despliegue

1. **Conecta tu repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa el repositorio `gaming-price`
   - Vercel detectará automáticamente que es un proyecto estático

2. **Configura las variables de entorno:**
   - Settings → Environment Variables
   - Agrega `ML_CLIENT_ID` y `ML_CLIENT_SECRET`

3. **Despliega:**
   - Vercel desplegará automáticamente
   - La función `/api/mercadolibre` estará disponible en producción

## Endpoints Disponibles

- **Frontend**: `/` (index.html)
- **API Mercado Libre**: `/api/mercadolibre?query=zelda`

## Nota Importante

⚠️ **La API de Mercado Libre puede estar bloqueada por PolicyAgent (403 Forbidden).**

Aunque tengas las credenciales correctas, Mercado Libre puede bloquear las búsquedas automáticas. La función manejará esto y devolverá un error 403 con información clara.

## Testing Local

Para probar localmente antes de desplegar:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Iniciar servidor local
vercel dev

# La función estará en: http://localhost:3000/api/mercadolibre
```

## Troubleshooting

### Error: "Credenciales no configuradas"
- Verifica que `ML_CLIENT_ID` y `ML_CLIENT_SECRET` estén en Vercel
- Asegúrate de que estén disponibles en el entorno correcto (Production, Preview, Development)

### Error 403 PolicyAgent
- Esto es normal - Mercado Libre bloquea búsquedas automáticas
- No es un error de tu código
- La app mostrará un mensaje informativo al usuario

### La función no responde
- Verifica los logs en Vercel Dashboard
- Revisa que la función esté desplegada correctamente
- Verifica que la ruta `/api/mercadolibre` esté accesible
