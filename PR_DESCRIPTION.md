# Pull Request: Document Mercado Libre API Blockage

## 📋 Resumen

Este PR documenta que la API de Mercado Libre está **permanentemente bloqueada** y no funcionará. También mejora el manejo de errores y la experiencia del usuario.

## ⚠️ Cambio Importante

**La API de búsqueda de Mercado Libre (`/sites/MLM/search`) está BLOQUEADA por PolicyAgent y NO FUNCIONA.**

- ❌ Mercado Libre: Devuelve 403 Forbidden (PolicyAgent) - **NO FUNCIONA**
- ✅ CheapShark: Funciona perfectamente para precios digitales

## 🔧 Cambios Realizados

### Nuevos Archivos
- `backend-server.js` - Backend Node.js/Express para manejar requests a ML API
- `package.json` - Dependencias del proyecto (express, cors)
- `STATUS.md` - Documentación del estado actual del proyecto
- `EXPLICACION_ML.md` - Explicación detallada del bloqueo de ML
- `QUICKSTART.md` - Guía rápida de inicio
- `.gitignore` - Archivos a ignorar en git

### Archivos Modificados
- `README.md` - Actualizado con advertencias claras sobre el bloqueo de ML
- `index.html` - Mejoras en la estructura HTML
- `script.js` - Mejor manejo de errores y mensajes informativos

## ✅ Lo que Funciona

- **CheapShark API**: Funciona perfectamente
  - Muestra precios digitales (Steam, Epic, etc.)
  - Búsqueda en tiempo real
  - Resultados precisos

## ❌ Lo que NO Funciona

- **Mercado Libre API**: Bloqueada permanentemente
  - Error 403 Forbidden (PolicyAgent)
  - No hay solución conocida
  - Incluso con backend propio y credenciales válidas

## 🎯 Impacto

- Los usuarios verán un mensaje claro cuando ML esté bloqueado
- La app sigue siendo útil para comparar precios digitales
- La documentación es clara sobre las limitaciones

## 📝 Notas

Este no es un bug del código. Mercado Libre ha implementado PolicyAgent que bloquea todas las búsquedas automáticas, incluso con:
- Backend propio (no proxy público)
- Token OAuth válido
- Headers correctos
- User-Agent apropiado

## 🧪 Testing

1. Instalar dependencias: `npm install`
2. Iniciar backend: `npm start`
3. Abrir `index.html` en el navegador
4. Buscar un juego (ej: "zelda")
5. Verificar:
   - ✅ Precios digitales de CheapShark funcionan
   - ⚠️ Mensaje informativo sobre ML bloqueado

## 📚 Documentación

- `README.md` - Actualizado con advertencias claras
- `STATUS.md` - Estado actual del proyecto
- `EXPLICACION_ML.md` - Explicación detallada del problema
