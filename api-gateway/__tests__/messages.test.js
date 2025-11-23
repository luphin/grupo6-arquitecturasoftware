/**
 * Tests para el Servicio de Mensajes (Grupo 4)
 * Endpoint: /api/messages
 * Target: https://messages-service.kroder.dev
 */

const request = require('supertest');
const app = require('../app');

describe('Servicio de Mensajes', () => {

  // ==================== TESTS DE LISTADO DE MENSAJES ====================

  describe('GET /api/messages', () => {
    test('Debe aceptar peticiones de listado de mensajes', async () => {
      const response = await request(app).get('/api/messages');

      expect([200, 401, 404, 308]).toContain(response.status);
    });

    test('Debe retornar Content-Type JSON', async () => {
      const response = await request(app).get('/api/messages');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });

    // TODO: Agregar test con parámetros de query
    // test('Debe soportar filtrado por canal', async () => {
    //   const response = await request(app)
    //     .get('/api/messages?channelId=1')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body)).toBe(true);
    // });
  });

  // ==================== TESTS DE DETALLE DE MENSAJE ====================

  describe('GET /api/messages/:id', () => {
    test('Debe aceptar peticiones de mensaje específico', async () => {
      const response = await request(app).get('/api/messages/1');

      expect([200, 404, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para mensaje existente
    // test('Debe retornar datos del mensaje', async () => {
    //   const response = await request(app)
    //     .get('/api/messages/1')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('id');
    //   expect(response.body).toHaveProperty('content');
    //   expect(response.body).toHaveProperty('userId');
    //   expect(response.body).toHaveProperty('channelId');
    // });
  });

  // ==================== TESTS DE CREACIÓN DE MENSAJES ====================

  describe('POST /api/messages', () => {
    test('Debe aceptar peticiones de creación de mensaje', async () => {
      const newMessage = {
        content: 'Test message',
        channelId: 1
      };

      const response = await request(app)
        .post('/api/messages')
        .send(newMessage)
        .set('Content-Type', 'application/json');

      expect([200, 201, 400, 401, 403, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para creación exitosa
    // test('Debe crear un nuevo mensaje', async () => {
    //   const newMessage = {
    //     content: 'Hello World',
    //     channelId: 1
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/messages')
    //     .send(newMessage)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(201);
    //   expect(response.body).toHaveProperty('id');
    //   expect(response.body.content).toBe(newMessage.content);
    // });

    // TODO: Agregar test para validación de contenido
    // test('Debe rechazar mensaje vacío', async () => {
    //   const invalidMessage = {
    //     content: '',
    //     channelId: 1
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/messages')
    //     .send(invalidMessage)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(400);
    // });
  });

  // ==================== TESTS DE ACTUALIZACIÓN DE MENSAJES ====================

  describe('PUT /api/messages/:id', () => {
    test('Debe aceptar peticiones de actualización', async () => {
      const updates = {
        content: 'Updated message content'
      };

      const response = await request(app)
        .put('/api/messages/1')
        .send(updates)
        .set('Content-Type', 'application/json');

      expect([200, 401, 403, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para actualización exitosa
    // test('Debe actualizar un mensaje existente', async () => {
    //   const updates = { content: 'Edited message' };
    //
    //   const response = await request(app)
    //     .put('/api/messages/1')
    //     .send(updates)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body.content).toBe(updates.content);
    // });
  });

  // ==================== TESTS DE ELIMINACIÓN DE MENSAJES ====================

  describe('DELETE /api/messages/:id', () => {
    test('Debe aceptar peticiones de eliminación', async () => {
      const response = await request(app).delete('/api/messages/1');

      expect([200, 204, 401, 403, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para eliminación exitosa
    // test('Debe eliminar un mensaje', async () => {
    //   const response = await request(app)
    //     .delete('/api/messages/1')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect([200, 204, 308]).toContain(response.status);
    // });
  });

  // ==================== TESTS DE REACCIONES ====================

  describe('POST /api/messages/:id/reactions', () => {
    test('Debe aceptar peticiones de agregar reacción', async () => {
      const reaction = {
        emoji: '👍'
      };

      const response = await request(app)
        .post('/api/messages/1/reactions')
        .send(reaction)
        .set('Content-Type', 'application/json');

      expect([200, 201, 400, 401, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para agregar reacción
    // test('Debe agregar una reacción al mensaje', async () => {
    //   const reaction = { emoji: '❤️' };
    //
    //   const response = await request(app)
    //     .post('/api/messages/1/reactions')
    //     .send(reaction)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(201);
    // });
  });
});
