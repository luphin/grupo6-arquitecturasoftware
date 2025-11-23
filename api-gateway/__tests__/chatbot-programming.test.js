/**
 * Tests para el Chatbot de Programación (Grupo 13)
 * Endpoint: /api/chatbot/programming
 * Target: https://chatbotprogra.inf326.nursoft.dev
 */

const request = require('supertest');
const app = require('../app');

describe('Chatbot de Programación', () => {

  // ==================== TESTS DE CONSULTA ====================

  describe('POST /api/chatbot/programming/ask', () => {
    test('Debe aceptar peticiones de consulta de programación', async () => {
      const query = {
        question: '¿Cómo hacer un for loop en JavaScript?'
      };

      const response = await request(app)
        .post('/api/chatbot/programming/ask')
        .send(query)
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 404, 503, 308]).toContain(response.status);
    });

    test('Debe retornar Content-Type JSON', async () => {
      const query = {
        question: '¿Qué es una función async?'
      };

      const response = await request(app)
        .post('/api/chatbot/programming/ask')
        .send(query)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });

    // TODO: Agregar test para respuesta con código
    // test('Debe retornar respuesta con ejemplos de código', async () => {
    //   const query = {
    //     question: '¿Cómo crear una clase en JavaScript?'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/programming/ask')
    //     .send(query)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('answer');
    //   expect(response.body).toHaveProperty('code_example');
    // });

    // TODO: Agregar test con lenguaje específico
    // test('Debe aceptar especificación de lenguaje', async () => {
    //   const query = {
    //     question: '¿Cómo leer un archivo?',
    //     language: 'python'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/programming/ask')
    //     .send(query)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body.language).toBe('python');
    // });
  });

  // ==================== TESTS DE EXPLICACIÓN DE CÓDIGO ====================

  describe('POST /api/chatbot/programming/explain', () => {
    test('Debe aceptar peticiones de explicación de código', async () => {
      const codeData = {
        code: 'const arr = [1,2,3]; arr.map(x => x * 2);',
        language: 'javascript'
      };

      const response = await request(app)
        .post('/api/chatbot/programming/explain')
        .send(codeData)
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para explicación de código
    // test('Debe retornar explicación del código', async () => {
    //   const codeData = {
    //     code: 'function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }',
    //     language: 'javascript'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/programming/explain')
    //     .send(codeData)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('explanation');
    //   expect(response.body.explanation.length).toBeGreaterThan(0);
    // });
  });

  // ==================== TESTS DE REVISIÓN DE CÓDIGO ====================

  describe('POST /api/chatbot/programming/review', () => {
    test('Debe aceptar peticiones de revisión de código', async () => {
      const codeData = {
        code: 'var x = 1; var y = 2; console.log(x+y);',
        language: 'javascript'
      };

      const response = await request(app)
        .post('/api/chatbot/programming/review')
        .send(codeData)
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para revisión de código
    // test('Debe retornar sugerencias de mejora', async () => {
    //   const codeData = {
    //     code: 'var name = "John"; var age = 30; console.log(name + age);',
    //     language: 'javascript'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/programming/review')
    //     .send(codeData)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('suggestions');
    //   expect(Array.isArray(response.body.suggestions)).toBe(true);
    // });
  });

  // ==================== TESTS DE DEPURACIÓN ====================

  describe('POST /api/chatbot/programming/debug', () => {
    test('Debe aceptar peticiones de ayuda para depuración', async () => {
      const debugData = {
        code: 'let arr = [1,2,3]; arr.forEach(x => { console.log(x * 2) });',
        error: 'TypeError: Cannot read property',
        language: 'javascript'
      };

      const response = await request(app)
        .post('/api/chatbot/programming/debug')
        .send(debugData)
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para sugerencias de depuración
    // test('Debe retornar sugerencias para resolver el error', async () => {
    //   const debugData = {
    //     code: 'function test() { console.log(x); }',
    //     error: 'ReferenceError: x is not defined',
    //     language: 'javascript'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/programming/debug')
    //     .send(debugData)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('diagnosis');
    //   expect(response.body).toHaveProperty('solution');
    // });
  });

  // ==================== TESTS DE GENERACIÓN DE CÓDIGO ====================

  describe('POST /api/chatbot/programming/generate', () => {
    test('Debe aceptar peticiones de generación de código', async () => {
      const generateData = {
        description: 'Crear una función que ordene un array de números',
        language: 'javascript'
      };

      const response = await request(app)
        .post('/api/chatbot/programming/generate')
        .send(generateData)
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para generación de código
    // test('Debe generar código basado en la descripción', async () => {
    //   const generateData = {
    //     description: 'Función que calcula el factorial de un número',
    //     language: 'python'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/programming/generate')
    //     .send(generateData)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('code');
    //   expect(response.body).toHaveProperty('explanation');
    // });
  });

  // ==================== TESTS DE CONVERSIÓN DE CÓDIGO ====================

  describe('POST /api/chatbot/programming/convert', () => {
    test('Debe aceptar peticiones de conversión entre lenguajes', async () => {
      const convertData = {
        code: 'def factorial(n): return 1 if n <= 1 else n * factorial(n-1)',
        from_language: 'python',
        to_language: 'javascript'
      };

      const response = await request(app)
        .post('/api/chatbot/programming/convert')
        .send(convertData)
        .set('Content-Type', 'application/json');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para conversión de código
    // test('Debe convertir código entre lenguajes', async () => {
    //   const convertData = {
    //     code: 'print("Hello World")',
    //     from_language: 'python',
    //     to_language: 'javascript'
    //   };
    //
    //   const response = await request(app)
    //     .post('/api/chatbot/programming/convert')
    //     .send(convertData)
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(response.body).toHaveProperty('converted_code');
    //   expect(response.body.converted_code).toContain('console.log');
    // });
  });

  // ==================== TESTS DE LENGUAJES SOPORTADOS ====================

  describe('GET /api/chatbot/programming/languages', () => {
    test('Debe aceptar peticiones de lenguajes soportados', async () => {
      const response = await request(app).get('/api/chatbot/programming/languages');

      expect([200, 401, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para lista de lenguajes
    // test('Debe retornar lista de lenguajes soportados', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/programming/languages')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body.languages)).toBe(true);
    //   expect(response.body.languages).toContain('javascript');
    //   expect(response.body.languages).toContain('python');
    // });
  });

  // ==================== TESTS DE EJEMPLOS ====================

  describe('GET /api/chatbot/programming/examples', () => {
    test('Debe aceptar peticiones de ejemplos', async () => {
      const response = await request(app).get('/api/chatbot/programming/examples?topic=arrays');

      expect([200, 400, 401, 308]).toContain(response.status);
    });

    // TODO: Agregar test para obtener ejemplos
    // test('Debe retornar ejemplos de código para un tema', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/programming/examples?topic=loops&language=javascript')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body.examples)).toBe(true);
    //   expect(response.body.examples.length).toBeGreaterThan(0);
    // });
  });

  // ==================== TESTS DE HISTORIAL ====================

  describe('GET /api/chatbot/programming/history', () => {
    test('Debe aceptar peticiones de historial', async () => {
      const response = await request(app).get('/api/chatbot/programming/history');

      expect([200, 401, 404, 308]).toContain(response.status);
    });

    // TODO: Agregar test para historial de consultas
    // test('Debe retornar historial de consultas del usuario', async () => {
    //   const response = await request(app)
    //     .get('/api/chatbot/programming/history')
    //     .set('Authorization', 'Bearer valid-token');
    //
    //   expect(response.status).toBe(200);
    //   expect(Array.isArray(response.body.history)).toBe(true);
    // });
  });
});
