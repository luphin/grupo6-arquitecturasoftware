/**
 * Tests Moderación (Completo)
 * Incluye: Health, Analyze, Agregar Palabra (POST) y Eliminar Palabra (DELETE)
 * Autenticación: Header 'x-api-key'
 */

const request = require('supertest');
let app = require('../app');

// === FIX IMPORTACIÓN ===
if (app.default) app = app.default;
if (app.app) app = app.app;

// === CONFIGURACIÓN AUTH ===
const API_KEY_VALUE = process.env.TEST_TOKEN;
const API_KEY_HEADER = 'x-api-key';

const SERVICE_URL = '/api/moderation';
const wordToAdd = `test_del_${Math.floor(Math.random() * 10000)}`;

// Variable global para pasar el ID del test POST al test DELETE
let createdWordId = null;

describe('Servicio de Moderación', () => {

  beforeAll(() => {
    if (typeof app !== 'function' && (!app || typeof app.listen !== 'function')) {
      console.error('ERROR: La app no se importó correctamente.');
    }
  });

  // 1. TEST HEALTH
  describe(`GET ${SERVICE_URL}/health`, () => {
    test('Health Check debe responder 200', async () => {
      const response = await request(app).get(`${SERVICE_URL}/health`);
      expect([200, 304]).toContain(response.status);
    });
  });

  // 2. TEST ANALYZE
  describe(`POST ${SERVICE_URL}/moderation/analyze`, () => {
    test('Debe analizar texto correctamente', async () => {
      const response = await request(app)
        .post(`${SERVICE_URL}/moderation/analyze`)
        .set(API_KEY_HEADER, API_KEY_VALUE) 
        .send({
          language: "es",
          text: "Texto de prueba para análisis"
        });

      expect(response.status).toBe(200);
    });
  });

  // 3. TEST AGREGAR PALABRA
  describe(`POST ${SERVICE_URL}/blacklist/words`, () => {
    test('Debe agregar una palabra a la blacklist usando x-api-key', async () => {
      const response = await request(app)
        .post(`${SERVICE_URL}/blacklist/words`)
        .set(API_KEY_HEADER, API_KEY_VALUE)
        .set('Content-Type', 'application/json')
        .send({
          word: wordToAdd,
          language: "es",
          category: "insult",
          severity: "medium",
          is_regex: false,
          notes: "Creada para test de borrado"
        });

      expect([200, 201]).toContain(response.status);
      
      // === CAPTURAR ID PARA EL SIGUIENTE TEST ===
      if (response.body.data && response.body.data.id) {
          createdWordId = response.body.data.id;
          console.log(`Palabra creada con ID: ${createdWordId}`);
      } else if (response.body.id) {
          createdWordId = response.body.id;
      }
    });
  });

  // 4. TEST ELIMINAR PALABRA (Nuevo)
  describe(`DELETE ${SERVICE_URL}/blacklist/words/:word_id`, () => {
    test('Debe eliminar la palabra creada anteriormente', async () => {
      // Si el POST falló, saltamos este test para evitar falsos positivos
      if (!createdWordId) {
        console.warn('SALTANDO DELETE: No hay ID (el POST probablemente falló).');
        return;
      }

      const response = await request(app)
        .delete(`${SERVICE_URL}/blacklist/words/${createdWordId}`)
        .set(API_KEY_HEADER, API_KEY_VALUE); // Header requerido según imagen

      expect([200, 204]).toContain(response.status);

      // Verificamos estructura de respuesta según la imagen (si retorna 200)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        // La imagen muestra data.id en la respuesta de borrado
        if (response.body.data) {
             expect(response.body.data).toHaveProperty('id');
        }
      }
    });

    test('Debe retornar 404 si intentamos borrar una palabra que no existe', async () => {
      const fakeId = "id_falso_12345";
      const response = await request(app)
        .delete(`${SERVICE_URL}/blacklist/words/${fakeId}`)
        .set(API_KEY_HEADER, API_KEY_VALUE);

      expect(response.status).toBe(404);
    });
  });

});
