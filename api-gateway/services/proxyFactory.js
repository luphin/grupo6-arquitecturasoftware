/**
 * Factory para crear proxies de microservicios
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Crea un middleware proxy para un microservicio
 *
 * @param {Object} config - Configuración del servicio
 * @param {string} config.url - URL del microservicio
 * @param {string} config.prefix - Prefijo de la ruta (ej: /api/users)
 * @param {string} config.pathRewrite - Path de reescritura (ej: /v1)
 * @param {string} config.description - Descripción del servicio
 * @returns {Function} Middleware de proxy
 */
function createServiceProxy(config) {
  const { url, prefix, pathRewrite, description } = config;

  return createProxyMiddleware({
    target: url,
    changeOrigin: true,

    // Reescribir el path
    pathRewrite: (path, req) => {
      // El path aquí ya no tiene el prefix (Express lo removió)
      // Ejemplo: si llega /api/users/auth/login, aquí path = /auth/login
      const newPath = pathRewrite ? pathRewrite + path : path;

      console.log(`[PROXY] ${req.method} ${prefix}${path} -> ${url}${newPath}`);

      return newPath;
    },

    // Manejo de errores
    onError: (err, req, res) => {
      console.error(`[PROXY ERROR] ${req.method} ${req.path}:`, err.message);

      res.status(502).json({
        error: 'BAD_GATEWAY',
        message: `Error al conectar con ${description}`,
        service: prefix,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    },

    // Log de respuestas exitosas (solo en desarrollo)
    onProxyRes: (proxyRes, req, res) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PROXY RESPONSE] ${req.method} ${prefix}${req.path} -> ${proxyRes.statusCode}`);
      }
    },

    // Timeout de 30 segundos
    proxyTimeout: 30000,

    // Log level según entorno
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
  });
}

module.exports = { createServiceProxy };
