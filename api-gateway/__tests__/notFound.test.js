const request = require('supertest');
const app = require('../app');

describe('Manejo de rutas no encontradas', () => {
  test('Debe retornar status 404 para rutas inexistentes', async () => {
    const response = await request(app).get('/ruta-inexistente');
    expect(response.status).toBe(404);
  });

  test('Debe retornar un objeto JSON con error, message, path y hint', async () => {
    const response = await request(app).get('/ruta-inexistente');

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('path');
    expect(response.body).toHaveProperty('hint');
  });

  test('El error debe ser "NOT_FOUND"', async () => {
    const response = await request(app).get('/ruta-inexistente');

    expect(response.body.error).toBe('NOT_FOUND');
  });

  test('El path debe coincidir con la ruta solicitada', async () => {
    const testPath = '/esta-ruta-no-existe';
    const response = await request(app).get(testPath);

    expect(response.body.path).toBe(testPath);
  });

  test('Debe incluir un hint para ayudar al usuario', async () => {
    const response = await request(app).get('/ruta-inexistente');

    expect(response.body.hint).toContain('/services');
  });
});
