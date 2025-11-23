const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  test('Debe retornar status 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  test('Debe retornar un objeto JSON con status, uptime y timestamp', async () => {
    const response = await request(app).get('/health');

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('El status debe ser "Gateway Running"', async () => {
    const response = await request(app).get('/health');

    expect(response.body.status).toBe('Gateway Running');
  });

  test('El uptime debe ser un número positivo', async () => {
    const response = await request(app).get('/health');

    expect(typeof response.body.uptime).toBe('number');
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });

  test('El timestamp debe ser una fecha válida en formato ISO', async () => {
    const response = await request(app).get('/health');

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.toString()).not.toBe('Invalid Date');
  });

  test('El Content-Type debe ser application/json', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['content-type']).toMatch(/json/);
  });
});
