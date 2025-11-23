# API Gateway - Documentación

## Descripción

API Gateway modular que centraliza todas las llamadas a los microservicios del proyecto. Proporciona un punto único de entrada para el frontend, resolviendo problemas de CORS y simplificando la gestión de múltiples APIs.

## Estructura del Proyecto

```
api-gateway/
├── server.js                 # Servidor principal
├── .env                      # Variables de entorno
├── package.json              # Dependencias
├── config/
│   └── services.js          # Configuración de todos los servicios
└── services/
    ├── index.js             # Registro de servicios
    └── proxyFactory.js      # Factory para crear proxies
```

## Instalación

```bash
cd api-gateway
npm install
```

## Configuración

Todas las URLs de los microservicios deben estár en el `.env`:

## Ejecución

```bash
# Desarrollo
node server.js

# Con nodemon (auto-reload)
npm install -g nodemon
nodemon server.js
```

## Servicios Disponibles

| Servicio | Prefix |
|----------|--------|
| **Usuarios** | `/api/users` |
| **Canales** | `/api/channels` |
| **Hilos** | `/api/threads` |
| **Mensajes** | `/api/messages` |
| **Presencia** | `/api/presence` |
| **Moderación** | `/api/moderation` |
| **Archivos** | `/api/files` |
| **Búsqueda** | `/api/search` |
| **Bot Wikipedia** | `/api/chatbot/wikipedia` |
| **Bot Programación** | `/api/chatbot/programming` |

## Rutas del Gateway

### Health Check
```bash
GET http://localhost:8080/health
```

Respuesta:
```json
{
  "status": "Gateway Running",
  "uptime": 123.456,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Lista de Servicios
```bash
GET http://localhost:8080/services
```

Respuesta:
```json
{
  "total": 10,
  "services": [
    {
      "name": "users",
      "prefix": "/api/users",
      "url": "https://users.inf326.nursoft.dev",
      "description": "Servicio de autenticación y gestión de usuarios"
    },
    ...
  ]
}
```

## Ejemplos de Uso

### Desde el Frontend

```typescript
// Login
const response = await fetch('http://localhost:8080/api/users/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username_or_email: 'user@email.com', password: '123' })
});

// Obtener canales
const channels = await fetch('http://localhost:8080/api/channels');

// Enviar mensaje
const message = await fetch('http://localhost:8080/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ channelId: '1', content: 'Hola!' })
});

// Moderar contenido
const moderation = await fetch('http://localhost:8080/api/moderation/moderate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'Mensaje a moderar' })
});
```

### Con cURL

```bash
# Login
curl -X POST http://localhost:8080/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username_or_email": "user@email.com", "password": "123"}'

# Obtener servicios
curl http://localhost:8080/services

# Health check
curl http://localhost:8080/health
```

## Agregar un Nuevo Servicio

### 1. Agregar URL al `.env`

```env
NEW_SERVICE_URL=https://new-service.example.com
```

### 2. Configurar en `config/services.js`

```javascript
module.exports = {
  // ... servicios existentes

  newService: {
    url: process.env.NEW_SERVICE_URL || 'https://new-service.example.com',
    prefix: '/api/new-service',
    pathRewrite: '/v1', // opcional, según tu API
    description: 'Descripción del nuevo servicio'
  }
};
```

### 3. Reiniciar el Gateway

```bash
node server.js
```

¡Listo! El nuevo servicio estará disponible automáticamente.

## Logs

El Gateway imprime logs detallados en consola:

```
[PROXY] POST /api/users/auth/login -> [domain]/v1/auth/login
[PROXY RESPONSE] POST /api/users/auth/login -> 200
```

En caso de error:
```
[PROXY ERROR] POST /api/users/auth/login: ECONNREFUSED
```

## Manejo de Errores

### Error de Conexión (502 Bad Gateway)

```json
{
  "error": "BAD_GATEWAY",
  "message": "Error al conectar con Servicio de usuarios",
  "service": "/api/users",
  "details": "ECONNREFUSED"
}
```

### Ruta No Encontrada (404)

```json
{
  "error": "NOT_FOUND",
  "message": "Ruta no encontrada",
  "path": "/api/unknown",
  "hint": "Visita /services para ver los servicios disponibles"
}
```

## Características

✅ **Modular**: Fácil agregar/quitar servicios
✅ **CORS**: Configurado automáticamente
✅ **Logs**: Detallados por servicio
✅ **Manejo de Errores**: Mensajes claros
✅ **Health Check**: Monitoreo del estado
✅ **Timeout**: 30 segundos por petición
✅ **Auto-discovery**: Endpoint `/services` lista todos los servicios

## Producción

Para producción, cambia el entorno:

```env
NODE_ENV=production
```

Esto reduce los logs y oculta detalles de errores internos.

## Troubleshooting

### El Gateway no inicia
- Verifica que el puerto 8080 esté disponible
- Revisa que las dependencias estén instaladas: `npm install`

### Error de CORS
- Verifica `FRONTEND_URL` en `.env`
- Asegúrate de que el frontend use la URL correcta del Gateway

### Servicio no responde
- Verifica que la URL del servicio sea correcta
- Prueba la URL directamente en el navegador
- Revisa los logs del Gateway

### Ruta incorrecta
- Visita `http://localhost:8080/services` para ver las rutas disponibles
- Verifica el `pathRewrite` en `config/services.js`

## Contacto

Para agregar nuevos servicios o reportar problemas, contacta al equipo de desarrollo.
