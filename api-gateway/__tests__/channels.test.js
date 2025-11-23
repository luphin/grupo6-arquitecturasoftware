/**
 * Tests para el Servicio de Canales (Grupo 2)
 * Endpoint: /api/channels
 * Target: https://channel-api.inf326.nur.dev/v1
 */

const request = require('supertest');
const app = require('../app');

const channel_id = process.env.TEST_CHANNEL_ID

describe('Servicio de Canales', () => {

  // ==================== TESTS DE LISTADO DE CANALES ====================

  describe('GET /api/channels/channels', () => {
    test('Debe aceptar peticiones de listado de canales', async () => {
      const response = await request(app).get('/api/channels/channels/?page=1&page_size=10');

      expect([200, 401, 404, 308]).toContain(response.status);
    });

    test('Debe retornar Content-Type JSON', async () => {
      const response = await request(app).get('/api/channels/channels/?page=1&page_size=10');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });

      });

  // ==================== TESTS DE DETALLE DE CANAL ====================

  describe('GET /api/channels/channels/:id', () => {
    test('Debe aceptar peticiones de canal específico', async () => {
      const response = await request(app).get(`/api/channels/channels/${channel_id}`);

      expect([200, 404, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para canal existente
    // test('Debe retornar datos del canal', async () => {
    //   const response = await request(app)
    //     .get('/api/channels/1')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('id');
    //   expect(response.body).toHaveProperty('name');
    // });

    // TODO: Agregar test para canal no encontrado
    // test('Debe retornar 404 para canal inexistente', async () => {
    //   const response = await request(app)
    //     .get('/api/channels/999999')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(404);
    // });
  });

  // ==================== TESTS OBTENER INFO BASICA DE CANAL ====================

	describe('GET /api/channels/channels/:channel_id/basic', () => {
		test('Debe entregar información del canal y validar campos en 200', async () => {
			const response = await request(app).get(`/api/channels/channels/${channel_id}/basic`);

			expect([200, 201, 400, 401, 403, 404, 308]).toContain(response.status);

			// Validación de campos específicos para status 200
			if (response.status === 200) {
				expect(response.body).toHaveProperty('id');
				expect(response.body).toHaveProperty('name');
				expect(response.body).toHaveProperty('owner_id');
				expect(response.body).toHaveProperty('channel_type');
				expect(response.body).toHaveProperty('created_at');
				expect(response.body).toHaveProperty('user_count');
			}
		});
	});

  // ==================== TESTS CHECK CHANNEL STATUS ====================

	describe('GET /api/channels/channels/:channel_id/status', () => {
		test('Debe entregar información de status del canal y validar campos en 200', async () => {
			const response = await request(app).get(`/api/channels/channels/${channel_id}/status`);

			expect([200, 201, 400, 401, 403, 404, 308]).toContain(response.status);

			// Validación de campos específicos para status 200
			if (response.status === 200) {
				expect(response.body).toHaveProperty('id');
				expect(response.body).toHaveProperty('is_active');
			}
		});
	});
 });
