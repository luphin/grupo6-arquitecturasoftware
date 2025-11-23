# Template para Tests de Servicios

Esta guía documenta la estructura estándar que deben seguir todos los tests de servicios en el API Gateway.

## Estructura de un Archivo de Test

```javascript
// 1. IMPORTS - Importar dependencias necesarias
const request = require('supertest');
const app = require('../app');

// 2. DESCRIBE PRINCIPAL - Agrupa todos los tests del servicio
describe('Nombre del Servicio', () => {

  // 3. DESCRIBE POR ENDPOINT - Agrupa tests de cada endpoint
  describe('GET /ruta/del/endpoint', () => {

    // 4. TEST: Verificar código de estado
    test('Debe retornar status 200', async () => {
      const response = await request(app).get('/ruta/del/endpoint');
      expect(response.status).toBe(200);
    });

    // 5. TEST: Verificar estructura de respuesta
    test('Debe retornar la estructura correcta', async () => {
      const response = await request(app).get('/ruta/del/endpoint');

      expect(response.body).toHaveProperty('campo1');
      expect(response.body).toHaveProperty('campo2');
    });

    // 6. TEST: Verificar tipos de datos
    test('Los datos deben tener el tipo correcto', async () => {
      const response = await request(app).get('/ruta/del/endpoint');

      expect(typeof response.body.campo1).toBe('string');
      expect(typeof response.body.campo2).toBe('number');
    });

    // 7. TEST: Verificar Content-Type
    test('El Content-Type debe ser application/json', async () => {
      const response = await request(app).get('/ruta/del/endpoint');
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
```

## Categorías de Tests

### 1. Tests de Código de Estado (Status Code)

**Propósito**: Verificar que el endpoint retorna el código HTTP correcto.

```javascript
test('Debe retornar status 200 para petición exitosa', async () => {
  const response = await request(app).get('/api/endpoint');
  expect(response.status).toBe(200);
});

test('Debe retornar status 201 al crear un recurso', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ data: 'test' });
  expect(response.status).toBe(201);
});

test('Debe retornar status 404 para recurso no encontrado', async () => {
  const response = await request(app).get('/api/endpoint/999999');
  expect(response.status).toBe(404);
});

test('Debe retornar status 400 para datos inválidos', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ invalid: 'data' });
  expect(response.status).toBe(400);
});
```

### 2. Tests de Estructura de Datos

**Propósito**: Verificar que la respuesta tiene la estructura esperada.

```javascript
test('Debe retornar objeto con propiedades requeridas', async () => {
  const response = await request(app).get('/api/endpoint');

  // Verificar propiedades principales
  expect(response.body).toHaveProperty('id');
  expect(response.body).toHaveProperty('name');
  expect(response.body).toHaveProperty('email');

  // Verificar propiedades anidadas
  expect(response.body).toHaveProperty('metadata');
  expect(response.body.metadata).toHaveProperty('createdAt');
});

test('Debe retornar un array de objetos', async () => {
  const response = await request(app).get('/api/endpoint/list');

  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBeGreaterThan(0);
});
```

### 3. Tests de Validación de Tipos

**Propósito**: Verificar que los datos tienen el tipo correcto.

```javascript
test('Los campos deben tener el tipo correcto', async () => {
  const response = await request(app).get('/api/endpoint');

  expect(typeof response.body.id).toBe('number');
  expect(typeof response.body.name).toBe('string');
  expect(typeof response.body.active).toBe('boolean');
  expect(Array.isArray(response.body.items)).toBe(true);
});

test('Las fechas deben ser válidas', async () => {
  const response = await request(app).get('/api/endpoint');

  const date = new Date(response.body.createdAt);
  expect(date).toBeInstanceOf(Date);
  expect(date.toString()).not.toBe('Invalid Date');
});
```

### 4. Tests de Validación de Valores

**Propósito**: Verificar que los valores están en rangos esperados o cumplen condiciones.

```javascript
test('Los valores numéricos deben estar en rangos válidos', async () => {
  const response = await request(app).get('/api/endpoint');

  expect(response.body.age).toBeGreaterThanOrEqual(0);
  expect(response.body.age).toBeLessThan(150);
});

test('Los strings no deben estar vacíos', async () => {
  const response = await request(app).get('/api/endpoint');

  expect(response.body.name.length).toBeGreaterThan(0);
  expect(response.body.email).toMatch(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
});

test('Los valores deben estar en una lista permitida', async () => {
  const response = await request(app).get('/api/endpoint');

  const validStatuses = ['active', 'inactive', 'pending'];
  expect(validStatuses).toContain(response.body.status);
});
```

### 5. Tests de Headers

**Propósito**: Verificar headers HTTP de respuesta.

```javascript
test('Debe incluir headers correctos', async () => {
  const response = await request(app).get('/api/endpoint');

  expect(response.headers['content-type']).toMatch(/json/);
  expect(response.headers).toHaveProperty('x-powered-by');
});

test('Debe incluir headers de seguridad', async () => {
  const response = await request(app).get('/api/endpoint');

  expect(response.headers).toHaveProperty('x-content-type-options');
});
```

### 6. Tests de Métodos HTTP

#### GET - Obtener datos
```javascript
describe('GET /api/resource', () => {
  test('Debe obtener la lista de recursos', async () => {
    const response = await request(app).get('/api/resource');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('Debe obtener un recurso específico por ID', async () => {
    const response = await request(app).get('/api/resource/1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(1);
  });
});
```

#### POST - Crear recursos
```javascript
describe('POST /api/resource', () => {
  test('Debe crear un nuevo recurso', async () => {
    const newResource = {
      name: 'Test Resource',
      description: 'Test Description'
    };

    const response = await request(app)
      .post('/api/resource')
      .send(newResource)
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newResource.name);
  });

  test('Debe rechazar datos inválidos', async () => {
    const invalidResource = {
      name: '' // nombre vacío
    };

    const response = await request(app)
      .post('/api/resource')
      .send(invalidResource);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
```

#### PUT/PATCH - Actualizar recursos
```javascript
describe('PUT /api/resource/:id', () => {
  test('Debe actualizar un recurso existente', async () => {
    const updates = {
      name: 'Updated Name'
    };

    const response = await request(app)
      .put('/api/resource/1')
      .send(updates);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(updates.name);
  });
});
```

#### DELETE - Eliminar recursos
```javascript
describe('DELETE /api/resource/:id', () => {
  test('Debe eliminar un recurso', async () => {
    const response = await request(app)
      .delete('/api/resource/1');

    expect(response.status).toBe(204); // o 200
  });

  test('Debe retornar 404 al intentar eliminar recurso inexistente', async () => {
    const response = await request(app)
      .delete('/api/resource/999999');

    expect(response.status).toBe(404);
  });
});
```

### 7. Tests con Autenticación

```javascript
describe('Endpoints protegidos', () => {
  let authToken;

  // Setup: obtener token antes de los tests
  beforeAll(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  test('Debe rechazar peticiones sin token', async () => {
    const response = await request(app)
      .get('/api/protected/resource');

    expect(response.status).toBe(401);
  });

  test('Debe permitir acceso con token válido', async () => {
    const response = await request(app)
      .get('/api/protected/resource')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });

  test('Debe rechazar tokens inválidos', async () => {
    const response = await request(app)
      .get('/api/protected/resource')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });
});
```

### 8. Tests de Casos Límite (Edge Cases)

```javascript
describe('Casos límite', () => {
  test('Debe manejar peticiones con parámetros vacíos', async () => {
    const response = await request(app).get('/api/resource?search=');
    expect(response.status).toBe(200);
  });

  test('Debe manejar peticiones con IDs negativos', async () => {
    const response = await request(app).get('/api/resource/-1');
    expect(response.status).toBe(400);
  });

  test('Debe manejar peticiones con IDs muy grandes', async () => {
    const response = await request(app).get('/api/resource/999999999');
    expect(response.status).toBe(404);
  });

  test('Debe manejar caracteres especiales en búsqueda', async () => {
    const response = await request(app).get('/api/resource?search=<script>alert("xss")</script>');
    expect(response.status).toBe(200);
    // Verificar que no haya inyección
  });
});
```

### 9. Tests de Paginación

```javascript
describe('Paginación', () => {
  test('Debe soportar parámetros de paginación', async () => {
    const response = await request(app)
      .get('/api/resource?page=1&limit=10');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('total');
  });

  test('La cantidad de resultados debe respetar el límite', async () => {
    const limit = 5;
    const response = await request(app)
      .get(`/api/resource?limit=${limit}`);

    expect(response.body.data.length).toBeLessThanOrEqual(limit);
  });
});
```

## Estructura Organizacional de un Archivo de Test Completo

```javascript
const request = require('supertest');
const app = require('../app');

// DESCRIBE PRINCIPAL - Nombre del Servicio
describe('Servicio de [NOMBRE]', () => {

  // SECCIÓN 1: Tests de Endpoints de Listado
  describe('GET /api/[servicio]', () => {
    test('Debe retornar status 200', async () => {
      // Test implementation
    });

    test('Debe retornar un array', async () => {
      // Test implementation
    });
  });

  // SECCIÓN 2: Tests de Endpoints de Detalle
  describe('GET /api/[servicio]/:id', () => {
    test('Debe retornar un objeto con el ID correcto', async () => {
      // Test implementation
    });

    test('Debe retornar 404 para ID inexistente', async () => {
      // Test implementation
    });
  });

  // SECCIÓN 3: Tests de Creación
  describe('POST /api/[servicio]', () => {
    test('Debe crear un nuevo recurso', async () => {
      // Test implementation
    });

    test('Debe validar campos requeridos', async () => {
      // Test implementation
    });
  });

  // SECCIÓN 4: Tests de Actualización
  describe('PUT /api/[servicio]/:id', () => {
    test('Debe actualizar un recurso existente', async () => {
      // Test implementation
    });
  });

  // SECCIÓN 5: Tests de Eliminación
  describe('DELETE /api/[servicio]/:id', () => {
    test('Debe eliminar un recurso', async () => {
      // Test implementation
    });
  });

  // SECCIÓN 6: Tests de Casos Especiales
  describe('Casos especiales', () => {
    test('Debe manejar errores correctamente', async () => {
      // Test implementation
    });
  });
});
```

## Mejores Prácticas

### 1. Nombres Descriptivos
```javascript
// ❌ MAL
test('test 1', async () => { ... });

// ✅ BIEN
test('Debe retornar status 200 cuando el usuario existe', async () => { ... });
```

### 2. Un Concepto por Test
```javascript
// ❌ MAL - Varios conceptos en un test
test('Debe funcionar correctamente', async () => {
  const response = await request(app).get('/api/users');
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('users');
  expect(response.body.users[0].email).toMatch(/email/);
  // Demasiadas cosas en un solo test
});

// ✅ BIEN - Un concepto por test
test('Debe retornar status 200', async () => {
  const response = await request(app).get('/api/users');
  expect(response.status).toBe(200);
});

test('Debe retornar propiedad users', async () => {
  const response = await request(app).get('/api/users');
  expect(response.body).toHaveProperty('users');
});
```

### 3. Usar async/await
```javascript
// ❌ MAL - Promesas sin manejar
test('Test', () => {
  request(app).get('/api/users').then(response => {
    expect(response.status).toBe(200);
  });
});

// ✅ BIEN - async/await
test('Test', async () => {
  const response = await request(app).get('/api/users');
  expect(response.status).toBe(200);
});
```

### 4. Comentar Tests Complejos
```javascript
test('Debe validar permisos de usuario', async () => {
  // Arrange: Crear usuario con permisos limitados
  const limitedUser = { role: 'viewer' };

  // Act: Intentar crear un recurso
  const response = await request(app)
    .post('/api/resource')
    .set('Authorization', `Bearer ${limitedUser.token}`)
    .send({ name: 'Test' });

  // Assert: Debe ser rechazado
  expect(response.status).toBe(403);
});
```

### 5. Minimum de 2 Tests por Endpoint
Cada endpoint debe tener al menos:
1. Test de caso exitoso (happy path)
2. Test de caso de error o validación

```javascript
describe('GET /api/users/:id', () => {
  // Mínimo requerido:
  test('Debe retornar usuario cuando existe', async () => {
    // happy path
  });

  test('Debe retornar 404 cuando no existe', async () => {
    // error case
  });

  // Tests adicionales recomendados:
  test('Debe retornar estructura correcta', async () => {
    // validation
  });
});
```

## Checklist de Tests por Endpoint

Para cada endpoint, considera implementar:

- [ ] Test de código de estado exitoso (200, 201, etc.)
- [ ] Test de código de estado de error (400, 404, 500)
- [ ] Test de estructura de respuesta
- [ ] Test de tipos de datos
- [ ] Test de Content-Type
- [ ] Test de validación de entrada (si aplica)
- [ ] Test de autenticación (si el endpoint está protegido)
- [ ] Test de casos límite
- [ ] Test de casos especiales del negocio

## Recursos Adicionales

- [Jest Matchers Documentation](https://jestjs.io/docs/expect)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
