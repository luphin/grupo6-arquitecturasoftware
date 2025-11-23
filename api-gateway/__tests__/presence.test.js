/**
 * Tests para el Servicio de Presencia (Grupo 5)
 * Endpoint: /api/presence
 * Target: https://presence-134-199-176-197.nip.io/api/v1.0.0
 */

const request = require('supertest');
const app = require('../app');

const user_id = process.env.TEST_USER_ID

describe('Servicio de Presencia', () => {

	// ==================== TESTS DE HEALTH ====================

  describe('GET /api/presence/presence/health', () => {
    test('Verificar Health Check', async () => {
      const response = await request(app).get('/api/presence/presence/health');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

  });

  // ==================== TESTS DE ESTADO DE USUARIO ====================

  describe('GET /api/presence/presence/:userId', () => {
    test('Debe aceptar peticiones de estado de usuario', async () => {
      const response = await request(app).get(`/api/presence/presence/${user_id}`);

      expect([200, 404, 401, 308]).toContain(response.status);
			// Lógica específica si la respuesta es exitosa (200)
			if (response.status === 200) {
				// Validar propiedades de nivel superior
				expect(response.body).toHaveProperty('status', 'OK');
				expect(response.body).toHaveProperty('message', 'Usuario encontrado correctamente');

				// Validar objeto 'data' y sus propiedades internas
				expect(response.body).toHaveProperty('data');
				const data = response.body.data;

				expect(data).toHaveProperty('id');
				expect(data).toHaveProperty('userId');
				expect(data).toHaveProperty('device');
				expect(data).toHaveProperty('status'); // Ej: online
				expect(data).toHaveProperty('connectedAt');
				expect(data).toHaveProperty('lastSeen');
			}
		});
    // TODO: Agregar test para usuario en línea
    // test('Debe retornar estado del usuario', async () => {
    //   const response = await request(app)
    //     .get('/api/presence/user/${user_id}')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('userId');
    //   expect(response.body).toHaveProperty('status');
    //   expect(['online', 'offline', 'away']).toContain(response.body.status);
    // });
  });

  // ==================== TESTS DE USUARIOS EN LÍNEA ====================

  describe('GET /api/presence/presence?status={online/offline}', () => {
    test('Debe indicar los usuarios online', async () => {
      const response = await request(app).get('/api/presence/presence?status=online');

      expect([200, 401, 404, 308]).toContain(response.status);
    });
    test('Debe indicar los usuarios offline', async () => {
      const response = await request(app).get('/api/presence/presence?status=offline');

      expect([200, 401, 404, 308]).toContain(response.status);
    });
    // TODO: Agregar test para verificar respuesta
    // test('Debe retornar lista de usuarios en línea', async () => {
    //   const response = await request(app)
    //     .get('/api/presence/online')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body)).toBe(true);
    // });
  });

  // ==================== TESTS DE STATS GENERALES ====================

  describe('GET /api/presence/presence/stats', () => {
    test('Debe aceptar peticiones de estado de usuario', async () => {
      const response = await request(app).get(`/api/presence/presence/stats`);

      expect([200, 404, 401, 308]).toContain(response.status);

			// Lógica específica si la respuesta es exitosa (200)
			if (response.status === 200) {
				// Validar propiedades de nivel superior
				expect(response.body).toHaveProperty('status', 'OK');
				expect(response.body).toHaveProperty('message', 'Estadísticas de presencia obtenidas correctamente');

				// Validar objeto 'data' y sus propiedades internas
				expect(response.body).toHaveProperty('data');
				const data = response.body.data;

				expect(data).toHaveProperty('total');
				expect(data).toHaveProperty('online');
				expect(data).toHaveProperty('offline');
			}
		});
    // TODO: Agregar test para usuario en línea
    // test('Debe retornar estado del usuario', async () => {
    //   const response = await request(app)
    //     .get('/api/presence/user/${user_id}')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('userId');
    //   expect(response.body).toHaveProperty('status');
    //   expect(['online', 'offline', 'away']).toContain(response.body.status);
    // });
  });
  });
