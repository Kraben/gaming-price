# ⚙️ Configuración de Vercel - Gaming Price MX

## 📋 Checklist de Configuración

### 1. Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → **Settings → Environment Variables** y agrega:

```
ML_CLIENT_ID = [tu_client_id_de_mercadolibre]
ML_CLIENT_SECRET = [tu_client_secret_de_mercadolibre]
```

**Importante**: Configúralas para **Production**, **Preview** y **Development** si quieres que funcionen en todos los entornos.

### 2. Estructura de Archivos

El proyecto debe tener esta estructura:

```
gaming-price/
├── api/
│   └── mercadolibre.js    ← Función serverless de Vercel
├── index.html
├── script.js
├── vercel.json            ← Configuración de Vercel
└── package.json           ← (opcional, para dependencias)
```

### 3. Despliegue

1. **Conecta el repositorio a Vercel**
2. **Vercel detectará automáticamente** que es un proyecto estático
3. **Las funciones en `/api/` se desplegarán automáticamente**
4. **Configura las variables de entorno** antes del primer despliegue

### 4. Testing

Después del despliegue, prueba:

```
https://tu-proyecto.vercel.app/api/mercadolibre?query=zelda
```

Deberías recibir una respuesta JSON con los resultados o un error 403 si ML está bloqueado.

## 🔍 Verificación

### Endpoint de la API

La función estará disponible en:
- **Producción**: `https://tu-proyecto.vercel.app/api/mercadolibre?query=zelda`
- **Preview**: `https://tu-proyecto-git-branch.vercel.app/api/mercadolibre?query=zelda`

### Respuesta Exitosa

```json
{
  "success": true,
  "results": [
    {
      "id": "MLA123456",
      "title": "Zelda Breath of the Wild",
      "price": 599,
      "currency": "MXN",
      "thumbnail": "https://...",
      "permalink": "https://...",
      "condition": "new",
      "shipping": {
        "free_shipping": false
      }
    }
  ],
  "total": 1
}
```

### Respuesta de Error (403 PolicyAgent)

```json
{
  "error": "Mercado Libre bloqueó la búsqueda (PolicyAgent)",
  "blocked_by": "PolicyAgent",
  "message": "La API de búsqueda está restringida por Mercado Libre. No hay solución conocida.",
  "status": 403
}
```

## 🐛 Troubleshooting

### Error: "Credenciales no configuradas"
- ✅ Verifica que `ML_CLIENT_ID` y `ML_CLIENT_SECRET` estén en Vercel
- ✅ Verifica que estén en el entorno correcto (Production/Preview/Development)
- ✅ Reinicia el despliegue después de agregar variables

### Error 403 PolicyAgent
- ⚠️ Esto es **normal** - Mercado Libre bloquea búsquedas automáticas
- ⚠️ No es un error de tu código
- ✅ La app mostrará un mensaje informativo al usuario

### La función no responde
- Verifica los logs en **Vercel Dashboard → Functions**
- Revisa que el archivo `/api/mercadolibre.js` esté en el repositorio
- Verifica que `vercel.json` esté configurado correctamente

## 📝 Notas

- El frontend detecta automáticamente si está en producción (Vercel) o desarrollo (localhost)
- En producción usa `/api/mercadolibre` (función serverless)
- En desarrollo usa `http://localhost:3001/api/mercadolibre` (backend local)
