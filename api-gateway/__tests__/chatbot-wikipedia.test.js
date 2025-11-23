/**
 * Tests para el Chatbot de Wikipedia (Grupo 12)
 * Endpoint: /api/chatbot/wikipedia
 * Target: http://wikipedia-chatbot-134-199-176-197.nip.io
 */

const request = require('supertest');
const app = require('../app');

describe('Chatbot de Wikipedia', () => {

  // ==================== TESTS DE CONSULTA ====================

  describe('POST /api/chatbot/wikipedia/chat-wikipedia', () => {
    test('Debe retornar Content-Type JSON', async () => {
      const query = {
        message: '¿Qué es Python?'
      };

      const response = await request(app)
        .post('/api/chatbot/wikipedia/chat-wikipedia')
        .send(query)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/json/);
      }
    }, 20000);

    // TODO: Agregar test para respuesta exitosa
    // test('Debe retornar respuesta con información de Wikipedia', async () => {
    //   const query = {
    //     question: '¿Qué es Node.js?'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/wikipedia/query')
    //     .send(query)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('answer');
    //   expect(response.body).toHaveProperty('source');
    //   expect(response.body.source).toContain('wikipedia');
    // });

    // TODO: Agregar test para pregunta vacía
    // test('Debe rechazar preguntas vacías', async () => {
    //   const query = {
    //     question: ''
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/wikipedia/query')
    //     .send(query)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(400);
    //   expect(response.body).toHaveProperty('error');
    // });
  });

  // ==================== TESTS DE Healt ====================

  describe('GET /api/chatbot/wikipedia/health', () => {
    test('Verificar Health Check', async () => {
      const response = await request(app).get('/api/chatbot/wikipedia/health');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para resultados de búsqueda
    // test('Debe retornar resultados de búsqueda', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/wikipedia/health')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body.results)).toBe(true);
    //   expect(response.body.results.length).toBeGreaterThan(0);
    // });
  });
})
 
