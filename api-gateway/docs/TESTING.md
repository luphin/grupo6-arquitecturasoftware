# Guía de Testing para API Gateway

Esta guía explica cómo ejecutar y crear pruebas para el API Gateway usando Jest y Supertest.

## Instalación de Dependencias

Las dependencias de testing ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install --save-dev jest supertest @types/jest
```

## Ejecutar los Tests

### Ejecutar todos los tests
```bash
npm test
```

Este comando ejecutará todos los tests y mostrará un reporte de cobertura.

### Ejecutar tests en modo watch (útil durante desarrollo)
```bash
npm run test:watch
```

### Ejecutar tests con salida detallada
```bash
npm run test:verbose
```

## Estructura de Tests

Los tests están organizados en la carpeta `__tests__/`:

```
api-gateway/
├── __tests__/
│   ├── health.test.js                 # Tests para endpoint /health
│   ├── services.test.js               # Tests para endpoint /services
│   ├── notFound.test.js               # Tests para manejo de 404
│   ├── users.test.js                  # Tests para servicio de usuarios
│   ├── channels.test.js               # Tests para servicio de canales
│   ├── threads.test.js                # Tests para servicio de hilos
│   ├── messages.test.js               # Tests para servicio de mensajes
│   ├── presence.test.js               # Tests para servicio de presencia
│   ├── moderation.test.js             # Tests para servicio de moderación
│   ├── files.test.js                  # Tests para servicio de archivos
│   ├── search.test.js                 # Tests para servicio de búsqueda
│   ├── chatbot-wikipedia.test.js      # Tests para chatbot de Wikipedia
│   └── chatbot-programming.test.js    # Tests para chatbot de programación
├── app.js                              # Aplicación Express (exportable para testing)
├── server.js                           # Servidor HTTP
├── TEST_TEMPLATE.md                    # Template y guía para crear tests
└── package.json
```

## Endpoints Testeados

### 1. GET /health
Verifica el estado del API Gateway.

**Tests implementados:**
- Retorna status 200
- Retorna JSON con propiedades correctas
- Status es "Gateway Running"
- Uptime es un número positivo
- Timestamp es una fecha válida
- Content-Type es application/json

### 2. GET /services
Lista todos los servicios disponibles.

**Tests implementados:**
- Retorna status 200
- Retorna JSON con total y services
- Total es un número positivo
- Services es un array
- Cantidad de servicios coincide con total
- Cada servicio tiene propiedades requeridas
- Servicios esperados están presentes
- Content-Type es application/json

### 3. Rutas no encontradas (404)
Manejo de errores para rutas inexistentes.

**Tests implementados:**
- Retorna status 404
- Retorna JSON con error, message, path y hint
- Error es "NOT_FOUND"
- Path coincide con ruta solicitada
- Incluye hint útil

## Tests de Servicios Proxy

Cada servicio tiene tests básicos que verifican que el API Gateway redirige correctamente las peticiones. Los tests incluidos son estructuras base con TODOs para que puedas expandirlos según las respuestas reales de cada servicio.

### 4. Servicio de Usuarios (`/api/users`)
**Archivo**: `users.test.js`
**Endpoints testeados**:
- POST `/api/users/auth/login` - Autenticación de usuarios
- POST `/api/users/auth/register` - Registro de nuevos usuarios
- GET `/api/users` - Listado de usuarios
- GET `/api/users/:id` - Obtener usuario específico
- PUT `/api/users/:id` - Actualizar usuario
- DELETE `/api/users/:id` - Eliminar usuario
- GET `/api/users/profile` - Perfil del usuario autenticado

### 5. Servicio de Canales (`/api/channels`)
**Archivo**: `channels.test.js`
**Endpoints testeados**:
- GET `/api/channels` - Listado de canales
- GET `/api/channels/:id` - Detalle de canal
- POST `/api/channels` - Crear canal
- PUT `/api/channels/:id` - Actualizar canal
- DELETE `/api/channels/:id` - Eliminar canal
- GET `/api/channels/:id/members` - Miembros del canal
- POST `/api/channels/:id/members` - Agregar miembro a canal

### 6. Servicio de Hilos (`/api/threads`)
**Archivo**: `threads.test.js`
**Endpoints testeados**:
- GET `/api/threads` - Listado de hilos
- GET `/api/threads/:id` - Detalle de hilo
- POST `/api/threads` - Crear hilo
- PUT `/api/threads/:id` - Actualizar hilo
- DELETE `/api/threads/:id` - Eliminar hilo
- GET `/api/threads/:id/messages` - Mensajes del hilo

### 7. Servicio de Mensajes (`/api/messages`)
**Archivo**: `messages.test.js`
**Endpoints testeados**:
- GET `/api/messages` - Listado de mensajes
- GET `/api/messages/:id` - Detalle de mensaje
- POST `/api/messages` - Crear mensaje
- PUT `/api/messages/:id` - Actualizar mensaje
- DELETE `/api/messages/:id` - Eliminar mensaje
- POST `/api/messages/:id/reactions` - Agregar reacción a mensaje

### 8. Servicio de Presencia (`/api/presence`)
**Archivo**: `presence.test.js`
**Endpoints testeados**:
- GET `/api/presence/user/:userId` - Estado de usuario
- POST `/api/presence/update` - Actualizar estado
- GET `/api/presence/online` - Usuarios en línea
- GET `/api/presence/channel/:channelId` - Presencia en canal
- POST `/api/presence/heartbeat` - Mantener sesión activa

### 9. Servicio de Moderación (`/api/moderation`)
**Archivo**: `moderation.test.js`
**Endpoints testeados**:
- POST `/api/moderation/moderate` - Moderar contenido
- POST `/api/moderation/sentiment` - Análisis de sentimiento
- POST `/api/moderation/spam` - Detección de spam
- POST `/api/moderation/report` - Reportar contenido
- GET `/api/moderation/reports` - Listado de reportes
- PUT `/api/moderation/reports/:id` - Actualizar reporte
- GET `/api/moderation/filters` - Filtros de palabras
- POST `/api/moderation/filters` - Agregar filtro

### 10. Servicio de Archivos (`/api/files`)
**Archivo**: `files.test.js`
**Endpoints testeados**:
- POST `/api/files/upload` - Subir archivo
- GET `/api/files/:id` - Obtener archivo
- GET `/api/files` - Listado de archivos
- GET `/api/files/:id/metadata` - Metadata de archivo
- DELETE `/api/files/:id` - Eliminar archivo
- PATCH `/api/files/:id` - Actualizar metadata
- GET `/api/files/:id/download` - Descargar archivo

### 11. Servicio de Búsqueda (`/api/search`)
**Archivo**: `search.test.js`
**Endpoints testeados**:
- GET `/api/search` - Búsqueda general
- GET `/api/search/messages` - Buscar mensajes
- GET `/api/search/users` - Buscar usuarios
- GET `/api/search/channels` - Buscar canales
- POST `/api/search/advanced` - Búsqueda avanzada
- GET `/api/search/autocomplete` - Autocompletado
- POST `/api/search/index` - Indexar contenido

### 12. Chatbot de Wikipedia (`/api/chatbot/wikipedia`)
**Archivo**: `chatbot-wikipedia.test.js`
**Endpoints testeados**:
- POST `/api/chatbot/wikipedia/query` - Consulta al chatbot
- GET `/api/chatbot/wikipedia/search` - Buscar en Wikipedia
- GET `/api/chatbot/wikipedia/article/:title` - Obtener artículo
- GET `/api/chatbot/wikipedia/summary/:title` - Resumen de artículo
- GET `/api/chatbot/wikipedia/history` - Historial de consultas
- GET `/api/chatbot/wikipedia/categories/:title` - Categorías de artículo

### 13. Chatbot de Programación (`/api/chatbot/programming`)
**Archivo**: `chatbot-programming.test.js`
**Endpoints testeados**:
- POST `/api/chatbot/programming/ask` - Consulta de programación
- POST `/api/chatbot/programming/explain` - Explicar código
- POST `/api/chatbot/programming/review` - Revisar código
- POST `/api/chatbot/programming/debug` - Ayuda para depuración
- POST `/api/chatbot/programming/generate` - Generar código
- POST `/api/chatbot/programming/convert` - Convertir entre lenguajes
- GET `/api/chatbot/programming/languages` - Lenguajes soportados
- GET `/api/chatbot/programming/examples` - Ejemplos de código
- GET `/api/chatbot/programming/history` - Historial de consultas

## Cómo Expandir los Tests

Cada archivo de servicio incluye tests básicos que verifican que el proxy funciona, y tests comentados con TODO que puedes descomentar y adaptar cuando:

1. Conozcas la estructura exacta de las respuestas del servicio
2. Tengas acceso a datos de prueba o un ambiente de testing
3. Necesites validar lógica específica del negocio

**Ejemplo de cómo expandir un test**:

```javascript
// Test básico (ya implementado)
test('Debe aceptar peticiones de login', async () => {
  const response = await request(app).post('/api/users/auth/login').send({...});
  expect([200, 401, 400]).toContain(response.status);
});

// Test expandido (descomenta y adapta el TODO)
test('Debe retornar token en login exitoso', async () => {
  const response = await request(app)
    .post('/api/users/auth/login')
    .send({ email: 'test@example.com', password: 'validpass' });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('token');
  expect(response.body.token.length).toBeGreaterThan(0);
});
```

## Cómo Crear Nuevos Tests

### Ejemplo básico para un endpoint:

```javascript
const request = require('supertest');
const app = require('../app');

describe('GET /tu-endpoint', () => {
  test('Debe retornar status 200', async () => {
    const response = await request(app).get('/tu-endpoint');
    expect(response.status).toBe(200);
  });

  test('Debe retornar datos correctos', async () => {
    const response = await request(app).get('/tu-endpoint');

    expect(response.body).toHaveProperty('propiedad');
    expect(response.body.propiedad).toBe('valor esperado');
  });
});
```

### Ejemplo de test para POST:

```javascript
test('Debe crear un recurso correctamente', async () => {
  const nuevoRecurso = {
    nombre: 'Test',
    valor: 123
  };

  const response = await request(app)
    .post('/endpoint')
    .send(nuevoRecurso)
    .set('Content-Type', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
});
```

## Matchers Útiles de Jest

- `toBe(valor)` - Igualdad estricta
- `toEqual(objeto)` - Igualdad de objetos/arrays
- `toHaveProperty(key)` - Verificar propiedad
- `toBeGreaterThan(num)` - Mayor que
- `toMatch(/regex/)` - Coincidir con regex
- `toContain(item)` - Array contiene item

## Cobertura de Código

Jest genera automáticamente un reporte de cobertura en:
- `coverage/lcov-report/index.html` (visualización HTML)
- `coverage/` (varios formatos)

## Tips para Testing

1. **Mínimo 2 tests por endpoint**: El requisito mínimo es 2 tests, pero se recomienda más para cubrir casos edge.

2. **Casos a considerar**:
   - Caso exitoso (happy path)
   - Validación de estructura de respuesta
   - Validación de códigos de estado
   - Validación de tipos de datos
   - Casos de error

3. **Organización**:
   - Un archivo de test por endpoint o funcionalidad
   - Usar `describe` para agrupar tests relacionados
   - Nombres descriptivos para cada test

4. **Async/Await**: Siempre usar `async/await` con Supertest para manejar promesas correctamente.

## Comparación con FastAPI Testing

Si vienes de FastAPI, aquí están las equivalencias:

| FastAPI (Python) | Express + Jest (Node.js) |
|------------------|--------------------------|
| `TestClient` | `supertest` |
| `pytest` | `jest` |
| `def test_...():` | `test('...', async () => {})` |
| `assert response.status_code == 200` | `expect(response.status).toBe(200)` |
| `assert response.json()["key"]` | `expect(response.body.key)` |

## Recursos Adicionales

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Express Testing Guide](https://expressjs.com/en/guide/testing.html)
