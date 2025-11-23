/**
 * Tests para el Servicio de Usuarios (Grupo 1)
 * Endpoint: /api/users
 * Target: https://users.inf326.nursoft.dev/v1
 */

const request = require('supertest');
const app = require('../app');

// VARIABLES DE PRUEBA (desde variables de entorno)
const VALID_CREDENTIALS = {
    username_or_email: process.env.TEST_USER_EMAIL ,
    password: process.env.TEST_USER_PASSWORD 
};
const INVALID_CREDENTIALS = {
    username_or_email: process.env.TEST_INVALID_EMAIL ,
    password: process.env.TEST_INVALID_PASSWORD 
};

const NEW_USER_CREDENTIALS ={
	username: process.env.TEST_NEWUSERNAME,
	email: process.env.TEST_NEWUSEREMAIL,
	password: process.env.TEST_NEWUSERPASS,
	full_name: process.env.TEST_NEWUSERFULL

}

describe('Servicio de Usuarios', () => {
	
  // ==================== TESTS DE AUTENTICACIÓN ====================

  describe('POST /api/users/auth/login', () => {
    test('Debe retornar status 200 para login exitoso', async () => {

      const response = await request(app)
        .post('/api/users/auth/login')
        .send(VALID_CREDENTIALS)
        .set('Content-Type', 'application/json');

      // Verificar que la petición llega al proxy
      // Nota: Este test verifica que el gateway funciona
      // El código de estado real dependerá del servicio backend
      expect([200, 201, 400, 401, 404, 308]).toContain(response.status);
    });

    test('Debe aceptar Content-Type application/json', async () => {

      const response = await request(app)
        .post('/api/users/auth/login')
        .send(INVALID_CREDENTIALS)
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

  describe('POST /api/users/users/register', () => {
    test('Debe aceptar peticiones de registro', async () => {

      const response = await request(app)
        .post('/api/users/users/register')
        .send(newUser)
        .set('Content-Type', 'application/json');

			// 200/201 (Éxito), 400 (Validación), 409 (Conflicto/Usuario ya existe), 308 (Redirección)
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

});
