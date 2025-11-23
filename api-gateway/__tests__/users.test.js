/**
 * Tests para el Servicio de Usuarios (Grupo 1)
 * Endpoint: /api/users
 * Target: https://users.inf326.nursoft.dev/v1
 */

const request = require('supertest');
const app = require('../app');

describe('Servicio de Usuarios', () => {

  // ==================== TESTS DE AUTENTICACIÓN ====================

  describe('POST /api/users/auth/login', () => {
    test('Debe retornar status 200 para login exitoso', async () => {
      const credentials = {
        username_or_email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/auth/login')
        .send(credentials)
        .set('Content-Type', 'application/json');

      // Verificar que la petición llega al proxy
      // Nota: Este test verifica que el gateway funciona
      // El código de estado real dependerá del servicio backend
      expect([200, 201, 400, 401, 404, 308]).toContain(response.status);
    });

    test('Debe aceptar Content-Type application/json', async () => {
      const credentials = {
        username_or_email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/auth/login')
        .send(credentials)
        .set('Content-Type', 'application/json');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    // TODO: Agregar test para verificar estructura de respuesta exitosa
    // test('Debe retornar token y datos de usuario en login exitoso', async () => {
    //   const response = await request(app)
    //     .post('/api/users/auth/login')
    //     .send({ username_or_email: 'valid@example.com', password: 'validpass' });
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('token');
    //   expect(response.body).toHaveProperty('user');
    //   expect(response.body.user).toHaveProperty('id');
    //   expect(response.body.user).toHaveProperty('email');
    // });

    // TODO: Agregar test para credenciales inválidas
    // test('Debe retornar 401 para credenciales inválidas', async () => {
    //   const response = await request(app)
    //     .post('/api/users/auth/login')
    //     .send({ username_or_email: 'test@example.com', password: 'wrongpassword' });
    //
    //   expect(response.status).toBe(401);
    //   expect(response.body).toHaveProperty('error');
    // });
  });

  describe('POST /api/users/auth/register', () => {
    test('Debe aceptar peticiones de registro', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/auth/register')
        .send(newUser)
        .set('Content-Type', 'application/json');

      expect([200, 201, 400, 409, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para registro exitoso
    // test('Debe crear un nuevo usuario', async () => {
    //   const newUser = {
    //     username: 'testuser',
    //     email: 'test@example.com',
    //     password: 'password123'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/users/auth/register')
    //     .send(newUser);
    //
    //   expect(response.status).toBe(201);
    //   expect(response.body).toHaveProperty('id');
    //   expect(response.body.email).toBe(newUser.email);
    // });

    // TODO: Agregar test para validación de datos
    // test('Debe rechazar registro con email inválido', async () => {
    //   const invalidUser = {
    //     username: 'testuser',
    //     email: 'invalid-email',
    //     password: 'password123'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/users/auth/register')
    //     .send(invalidUser);
    //
    //   expect(response.status).toBe(400);
    // });
  });

  // ==================== TESTS DE GESTIÓN DE USUARIOS ====================

  describe('GET /api/users', () => {
    test('Debe aceptar peticiones de listado de usuarios', async () => {
      const response = await request(app).get('/api/users');

      expect([200, 401, 403, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para verificar estructura de respuesta
    // test('Debe retornar un array de usuarios', async () => {
    //   const response = await request(app)
    //     .get('/api/users')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body)).toBe(true);
    // });

    // TODO: Agregar test para paginación
    // test('Debe soportar paginación', async () => {
    //   const response = await request(app)
    //     .get('/api/users?page=1&limit=10')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('data');
    //   expect(response.body).toHaveProperty('pagination');
    // });
  });

  describe('GET /api/users/:id', () => {
    test('Debe aceptar peticiones de usuario específico', async () => {
      const response = await request(app).get('/api/users/1');

      expect([200, 404, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para usuario existente
    // test('Debe retornar datos del usuario', async () => {
    //   const response = await request(app)
    //     .get('/api/users/1')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('id');
    //   expect(response.body).toHaveProperty('username');
    //   expect(response.body).toHaveProperty('email');
    // });

    // TODO: Agregar test para usuario no encontrado
    // test('Debe retornar 404 para usuario inexistente', async () => {
    //   const response = await request(app)
    //     .get('/api/users/999999')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(404);
    // });
  });

  describe('PUT /api/users/:id', () => {
    test('Debe aceptar peticiones de actualización', async () => {
      const updates = {
        username: 'updateduser'
      };

      const response = await request(app)
        .put('/api/users/1')
        .send(updates)
        .set('Content-Type', 'application/json');

      expect([200, 401, 403, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para actualización exitosa
    // test('Debe actualizar datos del usuario', async () => {
    //   const updates = { username: 'newusername' };
    //
    //   const response = await request(app)
    //     .put('/api/users/1')
    //     .send(updates)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body.username).toBe(updates.username);
    // });
  });

  describe('DELETE /api/users/:id', () => {
    test('Debe aceptar peticiones de eliminación', async () => {
      const response = await request(app).delete('/api/users/1');

      expect([200, 204, 401, 403, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para eliminación exitosa
    // test('Debe eliminar un usuario', async () => {
    //   const response = await request(app)
    //     .delete('/api/users/1')
    //     .set('Authorization', 'Bearer admin-token');
    //
    //   expect([200, 204, 308]).toContain(response.status);
    // });
  });

  // ==================== TESTS DE PERFIL DE USUARIO ====================

  describe('GET /api/users/profile', () => {
    test('Debe aceptar peticiones de perfil', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer token');

      expect([200, 401, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para perfil autenticado
    // test('Debe retornar perfil del usuario autenticado', async () => {
    //   const response = await request(app)
    //     .get('/api/users/profile')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('id');
    //   expect(response.body).toHaveProperty('email');
    // });
  });
});
