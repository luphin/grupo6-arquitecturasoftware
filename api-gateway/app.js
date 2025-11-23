// api-gateway/app.js
// Configuración de la aplicación Express (separada del servidor para facilitar testing)
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();

// Importar servicios
const { registerServices, getServicesInfo } = require('./services');

const app = express();

// Middleware de logging
app.use(morgan('dev'));

// Habilitar CORS para que el frontend pueda hacer peticiones
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// ===== RUTAS BÁSICAS =====

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'Gateway Running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Info de servicios disponibles
app.get('/services', (req, res) => {
    const services = getServicesInfo();
    res.status(200).json({
        total: services.length,
        services
    });
});

// ===== REGISTRAR TODOS LOS SERVICIOS PROXY =====
registerServices(app);

// ===== MANEJO DE RUTAS NO ENCONTRADAS =====
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Ruta no encontrada',
        path: req.path,
        hint: 'Visita /services para ver los servicios disponibles'
    });
});

// Exportar la aplicación para testing
module.exports = app;
