const request = require('supertest');
const app = require('../app');

describe('GET /services', () => {
  test('Debe retornar status 200', async () => {
    const response = await request(app).get('/services');
    expect(response.status).toBe(200);
  });

  test('Debe retornar un objeto JSON con total y services', async () => {
    const response = await request(app).get('/services');

    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('services');
  });

  test('El total debe ser un número positivo', async () => {
    const response = await request(app).get('/services');

    expect(typeof response.body.total).toBe('number');
    expect(response.body.total).toBeGreaterThan(0);
  });

  test('Services debe ser un array', async () => {
    const response = await request(app).get('/services');

    expect(Array.isArray(response.body.services)).toBe(true);
  });

  test('La cantidad de servicios debe coincidir con el total', async () => {
    const response = await request(app).get('/services');

    expect(response.body.services.length).toBe(response.body.total);
  });

  test('Cada servicio debe tener las propiedades requeridas', async () => {
    const response = await request(app).get('/services');

    response.body.services.forEach(service => {
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('prefix');
      expect(service).toHaveProperty('url');
      expect(service).toHaveProperty('description');
    });
  });

  test('Los servicios esperados deben estar presentes', async () => {
    const response = await request(app).get('/services');

    const serviceNames = response.body.services.map(s => s.name);
    const expectedServices = [
      'users', 'channels', 'threads', 'messages',
      'presence', 'moderation', 'files', 'search',
      'chatbotWikipedia', 'chatbotProgramming'
    ];

    expectedServices.forEach(serviceName => {
      expect(serviceNames).toContain(serviceName);
    });
  });

  test('El Content-Type debe ser application/json', async () => {
    const response = await request(app).get('/services');

    expect(response.headers['content-type']).toMatch(/json/);
  });
});
