/**
 * Configuración global para todos los tests
 * Este archivo se ejecuta antes de todos los tests para cargar las variables de entorno
 */

require('dotenv').config();

// Verificar que las variables de entorno necesarias estén configuradas
const requiredEnvVars = [
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
  'TEST_INVALID_EMAIL',
  'TEST_INVALID_PASSWORD',
  'TEST_NEWUSERNAME',
  'TEST_NEWUSEREMAIL',
  'TEST_NEWUSERPASS',
  'TEST_NEWUSERFULL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('\n ADVERTENCIA: Las siguientes variables de entorno no están configuradas:');
  missingVars.forEach(varName => {
    console.warn(`   - ${varName}`);
  });
  console.warn('\n   Para configurar, copia .env.example a .env');
  console.warn('   y configura tus propias credenciales de test.\n');
}
