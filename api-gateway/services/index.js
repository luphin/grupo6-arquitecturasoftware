/**
 * Registro de todos los servicios proxy
 */

const servicesConfig = require('../config/services');
const { createServiceProxy } = require('./proxyFactory');

/**
 * Registra todos los proxies en la aplicación Express
 *
 * @param {Express.Application} app - Aplicación Express
 */
function registerServices(app) {
  console.log('\n📡 Registrando servicios proxy...\n');

  // Iterar sobre todos los servicios configurados
  Object.entries(servicesConfig).forEach(([serviceName, config]) => {
    // Crear el proxy middleware
    const proxyMiddleware = createServiceProxy(config);

    // Registrar en Express
    app.use(config.prefix, proxyMiddleware);

    console.log(`[UP] ${serviceName.padEnd(20)} ${config.prefix.padEnd(30)} -> ${config.url}`);
  });

  console.log('\n[LOG] Todos los servicios registrados correctamente\n');
}

/**
 * Obtiene información de todos los servicios registrados
 *
 * @returns {Array} Lista de servicios con su configuración
 */
function getServicesInfo() {
  return Object.entries(servicesConfig).map(([name, config]) => ({
    name,
    prefix: config.prefix,
    url: config.url,
    description: config.description
  }));
}

module.exports = {
  registerServices,
  getServicesInfo,
  servicesConfig
};
