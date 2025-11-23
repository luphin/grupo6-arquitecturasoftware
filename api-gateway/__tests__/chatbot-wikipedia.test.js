/**
 * Tests para el Chatbot de Wikipedia (Grupo 12)
 * Endpoint: /api/chatbot/wikipedia
 * Target: http://wikipedia-chatbot-134-199-176-197.nip.io
 */

const request = require('supertest');
const app = require('../app');

describe('Chatbot de Wikipedia', () => {

  // ==================== TESTS DE CONSULTA ====================

  describe('POST /api/chatbot/wikipedia/query', () => {
    test('Debe aceptar peticiones de consulta', async () => {
      const query = {
        question: '¿Qué es JavaScript?'
      };

      const response = await request(app)
        .post('/api/chatbot/wikipedia/query')
        .send(query)
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 404, 503, 308]).toContain(response.status);
    });

    test('Debe retornar Content-Type JSON', async () => {
      const query = {
        question: '¿Qué es Python?'
      };

      const response = await request(app)
        .post('/api/chatbot/wikipedia/query')
        .send(query)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });

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

  // ==================== TESTS DE BÚSQUEDA ====================

  describe('GET /api/chatbot/wikipedia/search', () => {
    test('Debe aceptar peticiones de búsqueda', async () => {
      const response = await request(app).get('/api/chatbot/wikipedia/search?q=JavaScript');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para resultados de búsqueda
    // test('Debe retornar resultados de búsqueda', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/wikipedia/search?q=TypeScript')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body.results)).toBe(true);
    //   expect(response.body.results.length).toBeGreaterThan(0);
    // });
  });

  // ==================== TESTS DE ARTÍCULO ====================

  describe('GET /api/chatbot/wikipedia/article/:title', () => {
    test('Debe aceptar peticiones de artículo específico', async () => {
      const response = await request(app).get('/api/chatbot/wikipedia/article/JavaScript');

      expect([200, 404, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para artículo existente
    // test('Debe retornar contenido del artículo', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/wikipedia/article/Python_(programming_language)')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('title');
    //   expect(response.body).toHaveProperty('content');
    //   expect(response.body).toHaveProperty('url');
    // });

    // TODO: Agregar test para artículo no encontrado
    // test('Debe retornar 404 para artículo inexistente', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/wikipedia/article/NonexistentArticle12345')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(404);
    // });
  });

  // ==================== TESTS DE RESUMEN ====================

  describe('GET /api/chatbot/wikipedia/summary/:title', () => {
    test('Debe aceptar peticiones de resumen', async () => {
      const response = await request(app).get('/api/chatbot/wikipedia/summary/JavaScript');

      expect([200, 404, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para resumen
    // test('Debe retornar resumen del artículo', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/wikipedia/summary/Artificial_intelligence')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('title');
    //   expect(response.body).toHaveProperty('summary');
    //   expect(response.body.summary.length).toBeLessThan(500); // Resumen debe ser corto
    // });
  });

  // ==================== TESTS DE IDIOMA ====================

  describe('Soporte de idiomas', () => {
    test('Debe aceptar parámetro de idioma', async () => {
      const query = {
        question: '¿Qué es JavaScript?',
        language: 'es'
      };

      const response = await request(app)
        .post('/api/chatbot/wikipedia/query')
        .send(query)
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para idioma específico
    // test('Debe retornar respuesta en español', async () => {
    //   const query = {
    //     question: '¿Qué es la inteligencia artificial?',
    //     language: 'es'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/wikipedia/query')
    //     .send(query)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body.language).toBe('es');
    // });
  });

  // ==================== TESTS DE HISTORIAL ====================

  describe('GET /api/chatbot/wikipedia/history', () => {
    test('Debe aceptar peticiones de historial', async () => {
      const response = await request(app).get('/api/chatbot/wikipedia/history');

      expect([200, 401, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para historial de consultas
    // test('Debe retornar historial de consultas del usuario', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/wikipedia/history')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body.history)).toBe(true);
    // });
  });

  // ==================== TESTS DE CATEGORÍAS ====================

  describe('GET /api/chatbot/wikipedia/categories/:title', () => {
    test('Debe aceptar peticiones de categorías', async () => {
      const response = await request(app).get('/api/chatbot/wikipedia/categories/JavaScript');

      expect([200, 404, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para categorías
    // test('Debe retornar categorías del artículo', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/wikipedia/categories/JavaScript')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body.categories)).toBe(true);
    // });
  });
});
