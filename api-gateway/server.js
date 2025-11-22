// api-gateway/server.js (Versión de Proxy Final y Estable)
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan'); 
require('dotenv').config();

const app = express();
app.use(morgan('dev'));

const MODERATION_URL = process.env.MODERATION_URL || 'http://localhost:8000';

// 1. HEALTH CHECK: Debe ser el primer middleware que se ejecute (la ruta simple)
app.get('/health', (req, res) => res.status(200).json({ status: 'Gateway Running' }));

// 2. MIDDLEWARE DE PROXY: Todo lo que llegue (que no sea /health) lo envía al backend
app.use(
    '/', // Captura TODAS las rutas restantes
    createProxyMiddleware({
        target: MODERATION_URL,
        changeOrigin: true,
    })
);

// ... (app.listen)
