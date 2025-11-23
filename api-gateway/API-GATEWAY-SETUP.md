# API Gateway - Guía de Configuración

## ¿Qué es el API Gateway?

El API Gateway es un **proxy local** que centraliza todas las llamadas a los microservicios públicos desplegados en Kubernetes. Su función es:

1. **Resolver problemas de CORS** (Cross-Origin Resource Sharing)
2. **Centralizar** las URLs de los microservicios en un solo lugar
3. **Simplificar** las llamadas desde el frontend

## Arquitectura

```
Frontend (Next.js)     →     API Gateway (Local)     →     Microservicios (Kubernetes)
localhost:3000               localhost:8080                URLs públicas (*.inf326.nur.dev)

Ejemplo de flujo:
1. Frontend llama:      http://localhost:8080/api/moderation/moderate
2. Gateway redirige a:  https://moderation.inf326.nur.dev/api/v1/moderate
3. Respuesta vuelve al frontend
```

## Instalación y Ejecución

### 1. Instalar dependencias del API Gateway

```bash
cd api-gateway
npm install
```

### 2. Configurar variables de entorno

Ya existe un archivo `.env` en `api-gateway/.env` con la configuración:

```env
PORT=8080
FRONTEND_URL=http://localhost:3000
MODERATION_URL=https://moderation.inf326.nur.dev
USERS_URL=https://users.inf326.nur.dev
```

### 3. Ejecutar el API Gateway

```bash
cd api-gateway
node server.js
```

Deberías ver:
```
API Gateway running on http://localhost:8080
Proxying to:
  - Moderation: https://moderation.inf326.nur.dev
  - Users: https://users.inf326.nur.dev
```

### 4. Ejecutar el Frontend

En otra terminal:

```bash
cd chat-project
npm install
npm run dev
```

El frontend correrá en `http://localhost:3000`

## Uso desde el Frontend

### Opción 1: Usar el cliente API centralizado

```typescript
import api from '@/lib/api';

// Moderar un mensaje
const result = await api.moderation.moderateMessage('Este es un mensaje');

// Login de usuario
const user = await api.users.login('email@example.com', 'password');

// Obtener canales
const channels = await api.channels.getChannels();
```

### Opción 2: Llamadas directas con fetch

```typescript
const response = await fetch('http://localhost:8080/api/moderation/moderate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'Mensaje a moderar' })
});

const data = await response.json();
```

## Rutas Disponibles

### Moderación (`/api/moderation/*`)
- **Target**: `https://moderation.inf326.nur.dev/api/v1/*`
- **Ejemplo**: `GET /api/moderation/health` → `https://moderation.inf326.nur.dev/api/v1/health`

### Usuarios (`/api/users/*`)
- **Target**: `https://users.inf326.nur.dev/*`
- **Ejemplo**: `POST /api/users/login` → `https://users.inf326.nur.dev/login`

### Agregar Más Microservicios

Cuando otros equipos publiquen sus APIs, agrega las rutas en `api-gateway/server.js`:

```javascript
// Para el servicio de Channels
app.use('/api/channels', createProxyMiddleware({
    target: 'https://channels.inf326.nur.dev',
    changeOrigin: true,
    pathRewrite: { '^/api/channels': '/api/v1' }
}));

// Para el servicio de Messages
app.use('/api/messages', createProxyMiddleware({
    target: 'https://messages.inf326.nur.dev',
    changeOrigin: true,
    pathRewrite: { '^/api/messages': '/api/v1' }
}));
```

Y actualiza el archivo `.env`:

```env
CHANNELS_URL=https://channels.inf326.nur.dev
MESSAGES_URL=https://messages.inf326.nur.dev
```

## Testing

### 1. Verificar que el Gateway está corriendo

```bash
curl http://localhost:8080/health
```

Deberías recibir:
```json
{"status": "Gateway Running"}
```

### 2. Probar el proxy de moderación

```bash
curl -X POST http://localhost:8080/api/moderation/moderate \
  -H "Content-Type: application/json" \
  -d '{"content": "Mensaje de prueba"}'
```

### 3. Probar desde el navegador

Abre http://localhost:3000 y abre la consola del navegador. Ejecuta:

```javascript
fetch('http://localhost:8080/api/moderation/health')
  .then(r => r.json())
  .then(console.log);
```

## Problemas Comunes

### Error de CORS
**Síntoma**: `Access to fetch at '...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solución**: Verifica que el Gateway esté corriendo y que `FRONTEND_URL` en `.env` sea correcto.

### Error 404
**Síntoma**: `Cannot GET /api/moderation/...`

**Solución**: Verifica que:
1. El Gateway esté corriendo (`node server.js`)
2. La ruta esté correctamente configurada en `server.js`
3. El microservicio en Kubernetes esté disponible

### No se conecta al microservicio
**Síntoma**: `Error: connect ECONNREFUSED` o timeout

**Solución**: Verifica que:
1. La URL del microservicio en `.env` sea correcta
2. El microservicio esté desplegado y accesible públicamente
3. Prueba la URL directamente en el navegador: `https://moderation.inf326.nur.dev/api/v1/health`

## Despliegue en Producción

Cuando despliegues el frontend en producción, tienes dos opciones:

### Opción 1: Desplegar el Gateway junto al Frontend
Despliega ambos (frontend + gateway) en el mismo servidor/contenedor.

### Opción 2: Llamar directamente a las APIs públicas
Si no hay problemas de CORS en producción, el frontend puede llamar directamente a:
- `https://moderation.inf326.nur.dev/api/v1/...`
- `https://users.inf326.nur.dev/...`

Solo actualiza `NEXT_PUBLIC_API_URL` según el entorno:
```env
# Desarrollo
NEXT_PUBLIC_API_URL=http://localhost:8080

# Producción con Gateway
NEXT_PUBLIC_API_URL=https://mi-gateway.com

# Producción sin Gateway (directo a APIs)
# Modificar src/lib/api.ts para llamar a cada servicio directamente
```

## Resumen

- **API Gateway**: Proxy local que facilita la comunicación entre frontend y microservicios
- **Puerto**: 8080 (configurable en `.env`)
- **Función**: Resolver CORS y centralizar URLs de microservicios
- **NO está en Kubernetes**: Corre localmente o se despliega con el frontend
