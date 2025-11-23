// api-gateway/server.js
// Servidor HTTP que inicia el API Gateway
require('dotenv').config();
const app = require('./app');

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('\n🚀 API Gateway iniciado correctamente\n');
    console.log(`>> URL: http://localhost:${PORT}`);
    console.log(`>> Health: http://localhost:${PORT}/health`);
    console.log(`>> Services: http://localhost:${PORT}/services`);
    console.log(`>> Environment: ${process.env.NODE_ENV || 'development'}`);
});
