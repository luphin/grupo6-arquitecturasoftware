# Cómo Funciona el Proxy Automático del API Gateway

## Resumen Ejecutivo

El API Gateway funciona como un **proxy inverso automático**. Solo necesitas agregar servicios en `config/services.js` y el Gateway se encarga de redirigir automáticamente las peticiones del frontend a los microservicios correspondientes.

---

## Ejemplo Práctico: `/api/channels/all/programming`

### 1. Frontend hace la petición

```typescript
fetch('http://localhost:8080/api/channels/all/programming')
```

### 2. El Gateway recibe la petición

- **URL completa:** `http://localhost:8080/api/channels/all/programming`
- **Express identifica el prefijo:** `/api/channels`

### 3. Busca el servicio configurado

En `config/services.js`:
```javascript
channels: {
  url: 'https://channel-api.example.com',
  prefix: '/api/channels',        // <-- Coincide!
  pathRewrite: '',                // <-- Sin reescritura adicional
}
```

### 4. Redirección automática

| Paso | Valor |
|------|-------|
| **Entrada (Frontend)** | `http://localhost:8080/api/channels/all/programming` |
| **Express remueve prefix** | `/all/programming` |
| **pathRewrite transforma** | `/all/programming` (sin cambios) |
| **URL Final (Backend)** | `https://channel-api.example.com/all/programming` |

---

## Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND                                     │
│                        http://localhost:3000                                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ GET /api/channels/all/programming
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│                        http://localhost:8080                                 │
│                                                                              │
│  1. Recibe petición: /api/channels/all/programming                          │
│                                                                              │
│  2. Identifica servicio por prefix: /api/channels                           │
│                                                                              │
│  3. Busca en config/services.js:                                            │
│     {                                                                        │
│       url: 'https://channel-api.exmaple.com',                                │
│       prefix: '/api/channels',                                              │
│       pathRewrite: ''                                                        │
│     }                                                                        │
│                                                                              │
│  4. Express remueve el prefix → /all/programming                            │
│                                                                              │
│  5. Aplica pathRewrite (vacío) → /all/programming                           │
│                                                                              │
│  6. Construye URL final:                                                    │
│     https://channel-api.example.com/all/programming                      │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ GET /all/programming
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MICROSERVICIO (Channels)                             │
│                   https://channel-api.exampe.com                             │
│                                                                              │
│  Recibe: GET /all/programming                                               │
│  Procesa y responde                                                         │
│                                                                              │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ Response 200 OK
                                   ▼
                            API Gateway retorna
                                   │
                                   ▼
                              Frontend recibe
```

---

## Casos de Uso del pathRewrite

### Caso 1: Sin pathRewrite (Channels)

**Configuración:**
```javascript
channels: {
  url: 'https://channel-api.service-example.com',
  prefix: '/api/channels',
  pathRewrite: ''  // <-- Vacío, no agrega nada
}
```

**Transformación:**
```
Frontend:  localhost:8080/api/channels/all/programming
           ↓
Gateway:   /all/programming (remueve /api/channels)
           ↓
Backend:   https://channel-api.service-example.com/all/programming
```

---

### Caso 2: Con pathRewrite `/v1` (Users)

**Configuración:**
```javascript
users: {
  url: 'https://users.service-example.com',
  prefix: '/api/users',
  pathRewrite: '/v1'  // <-- Agrega /v1 al inicio
}
```

**Transformación:**
```
Frontend:  localhost:8080/api/users/auth/login
           ↓
Gateway:   /auth/login (remueve /api/users)
           ↓
           /v1/auth/login (agrega /v1)
           ↓
Backend:   https://users.service-example.com/v1/auth/login
```

**Ejemplo real:**
- **Petición:** `POST http://localhost:8080/api/users/auth/login`
- **Redirige a:** `POST https://users.service-example.com/v1/auth/login`

---

### Caso 3: Con pathRewrite `/api/v1` (Moderation)

**Configuración:**
```javascript
moderation: {
  url: 'https://moderation.service-example.com',
  prefix: '/api/moderation',
  pathRewrite: '/api/v1'  // <-- Agrega /api/v1 al inicio
}
```

**Transformación:**
```
Frontend:  localhost:8080/api/moderation/moderate
           ↓
Gateway:   /moderate (remueve /api/moderation)
           ↓
           /api/v1/moderate (agrega /api/v1)
           ↓
Backend:   https://moderation.service-example.com/api/v1/moderate
```

**Ejemplo real:**
- **Petición:** `POST http://localhost:8080/api/moderation/moderate`
- **Redirige a:** `POST https://moderation.service-example.com/api/v1/moderate`

---

### Caso 4: Con pathRewrite `/threads` (Threads)

**Configuración:**
```javascript
threads: {
  url: 'https://service-example.com',
  prefix: '/api/threads',
  pathRewrite: '/threads'  // <-- Agrega /threads
}
```

**Transformación:**
```
Frontend:  localhost:8080/api/threads/123/messages
           ↓
Gateway:   /123/messages (remueve /api/threads)
           ↓
           /threads/123/messages (agrega /threads)
           ↓
Backend:   https://service-example.com/threads/123/messages
```

---

## Cómo se Implementa en el Código

### `services/proxyFactory.js` (líneas 18-23)

```javascript
pathRewrite: (path, req) => {
  // path aquí YA NO tiene el prefix (Express lo removió automáticamente)
  // Solo agregamos el pathRewrite configurado
  const newPath = pathRewrite ? pathRewrite + path : path;

  console.log(`[PROXY] ${req.method} ${prefix}${path} -> ${url}${newPath}`);
  return newPath;
}
```

**Explicación paso a paso:**

1. **`path`**: Es la ruta SIN el prefix (Express ya lo removió)
   - Si llega `/api/users/auth/login`, path = `/auth/login`

2. **`pathRewrite`**: Es el valor configurado en `services.js`
   - Para users: `pathRewrite = '/v1'`

3. **`newPath`**: Combina pathRewrite + path
   - `newPath = '/v1' + '/auth/login' = '/v1/auth/login'`

4. **`url`**: Es la URL base del microservicio
   - Para users: `url = 'https://users.service-example.com'`

5. **URL final**: `url + newPath`
   - `'https://users.inf326.nursoft.dev' + '/v1/auth/login'`
   - = `'https://users.service-example.com/v1/auth/login'`

---

## Ejemplo de Logs en Consola

Cuando haces una petición, el Gateway imprime logs detallados:

```bash
# Petición de login
[PROXY] POST /api/users/auth/login -> https://users.service-example.com/v1/auth/login
[PROXY RESPONSE] POST /api/users/auth/login -> 200

# Petición de canales
[PROXY] GET /api/channels/all/programming -> https://channel-api.service-example.com/all/programming
[PROXY RESPONSE] GET /api/channels/all/programming -> 200

# Petición de moderación
[PROXY] POST /api/moderation/moderate -> https://moderation.service-example.com/api/v1/moderate
[PROXY RESPONSE] POST /api/moderation/moderate -> 200
```

---

## Tabla de Transformaciones de Todos los Servicios

| Servicio | Frontend (localhost:8080) |
|----------|---------------------------|
| **Users** | `/api/users/auth/login` |
| **Channels** | `/api/channels/all` |
| **Threads** | `/api/threads/123` |
| **Messages** | `/api/messages/send` |
| **Presence** | `/api/presence/status` |
| **Moderation** | `/api/moderation/moderate` |
| **Files** | `/api/files/upload` |
| **Search** | `/api/search/messages` |
| **Wiki Bot** | `/api/chatbot/wikipedia/query` |
| **Prog Bot** | `/api/chatbot/programming/ask` |

---

## Ventajas de Este Sistema

### ✅ Automático
Solo defines el servicio una vez en `config/services.js` y funciona automáticamente.

### ✅ Centralizado
Todas las rutas en un solo archivo de configuración.

### ✅ Transparente
El frontend no necesita saber las URLs reales de los microservicios.

### ✅ Flexible
Cada servicio puede tener su propio pathRewrite según sus necesidades.

### ✅ Fácil de mantener
Agregar un servicio = agregar un objeto en el archivo de configuración.

### ✅ CORS Resuelto
El Gateway maneja CORS automáticamente.

### ✅ Logs Detallados
Cada petición se registra con origen y destino.

### ✅ Manejo de Errores
Errores consistentes para todos los servicios.

---

## Cómo Agregar un Nuevo Servicio

### 1. Agregar URL al `.env`

```env
NEW_SERVICE_URL=https://new-service.example.com
```

### 2. Agregar configuración a `config/services.js`

```javascript
module.exports = {
  // ... servicios existentes

  newService: {
    url: process.env.NEW_SERVICE_URL || 'https://new-service.example.com',
    prefix: '/api/new-service',
    pathRewrite: '/v1',  // opcional, según la API
    description: 'Descripción del nuevo servicio'
  }
};
```

### 3. Reiniciar el Gateway

```bash
node server.js
```

### 4. ¡Listo!

Ahora puedes usar:
```javascript
fetch('http://localhost:8080/api/new-service/endpoint')
```

Y se redirigirá automáticamente a:
```
https://new-service.example.com/v1/endpoint
```

---

## Ejemplos de Uso desde el Frontend

### JavaScript/TypeScript

```javascript
// Login
const login = await fetch('http://localhost:8080/api/users/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username_or_email: 'user@email.com', password: '123' })
});

// Obtener canales
const channels = await fetch('http://localhost:8080/api/channels/all');

// Enviar mensaje
const message = await fetch('http://localhost:8080/api/messages/send', {
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

// Buscar mensajes
const results = await fetch('http://localhost:8080/api/search/messages?q=javascript');

// Preguntar al chatbot de programación
const answer = await fetch('http://localhost:8080/api/chatbot/programming/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: '¿Cómo funciona async/await?' })
});
```

### cURL (Testing)

```bash
# Login
curl -X POST http://localhost:8080/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username_or_email": "user@email.com", "password": "123"}'

# Obtener canales
curl http://localhost:8080/api/channels/all

# Moderar contenido
curl -X POST http://localhost:8080/api/moderation/moderate \
  -H "Content-Type: application/json" \
  -d '{"content": "Mensaje a moderar"}'

# Buscar
curl "http://localhost:8080/api/search/messages?q=javascript"
```

---

## Debugging

### Ver servicios disponibles

```bash
curl http://localhost:8080/services
```

**Respuesta:**
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

### Ver logs en tiempo real

Al hacer peticiones, verás en la consola del Gateway:

```
[PROXY] POST /api/users/auth/login -> https://users.service-example.com/v1/auth/login
[PROXY RESPONSE] POST /api/users/auth/login -> 200
```

### Verificar salud del Gateway

```bash
curl http://localhost:8080/health
```

**Respuesta:**
```json
{
  "status": "Gateway Running",
  "uptime": 123.456,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Resumen

1. **Frontend** llama a `localhost:8080/api/{servicio}/{ruta}`
2. **Gateway** identifica el servicio por el prefix `/api/{servicio}`
3. **Express** remueve el prefix automáticamente
4. **pathRewrite** agrega el prefijo del backend si es necesario
5. **Proxy** redirige a la URL real del microservicio
6. **Respuesta** regresa al frontend de forma transparente

**No necesitas tocar el código del servidor para agregar servicios**, solo editar `config/services.js` y reiniciar. 🎉
