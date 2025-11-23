/**
 * Configuración de URLs de todos los microservicios
 */

module.exports = {
  // Servicio de Usuarios (Grupo 1)
  users: {
    url: process.env.USERS_URL || 'https://users.inf326.nursoft.dev',
    prefix: '/api/users',
    pathRewrite: '/v1',
    description: 'Servicio de autenticación y gestión de usuarios'
  },

  // Servicio de Canales (Grupo 2)
  channels: {
    url: process.env.CHANNELS_URL || 'https://channel-api.inf326.nur.dev',
    prefix: '/api/channels',
    pathRewrite: '',
    description: 'Servicio de creación y gestión de canales'
  },

  // Servicio de Hilos (Grupo 3)
  threads: {
    url: process.env.THREADS_URL || 'https://demo.inf326.nur.dev',
    prefix: '/api/threads',
    pathRewrite: '/threads',
    description: 'Servicio de gestión de hilos de conversación'
  },

  // Servicio de Mensajes (Grupo 4)
  messages: {
    url: process.env.MESSAGES_URL || 'https://messages-service.kroder.dev',
    prefix: '/api/messages',
    pathRewrite: '',
    description: 'Servicio de publicación y gestión de mensajes'
  },

  // Servicio de Presencia (Grupo 5)
  presence: {
    url: process.env.PRESENCE_URL || 'https://presence-134-199-176-197.nip.io',
    prefix: '/api/presence',
    pathRewrite: '',
    description: 'Servicio de estado de conexión de usuarios'
  },

  // Servicio de Moderación (Grupo 6)
  moderation: {
    url: process.env.MODERATION_URL || 'https://moderation.inf326.nur.dev',
    prefix: '/api/moderation',
    pathRewrite: '/api/v1',
    description: 'Servicio de moderación de contenido'
  },

  // Servicio de Archivos (Grupo 7)
  files: {
    url: process.env.FILES_URL || 'http://file-service-134-199-176-197.nip.io',
    prefix: '/api/files',
    pathRewrite: '',
    description: 'Servicio de carga y gestión de archivos'
  },

  // Servicio de Búsqueda (Grupo 8)
  search: {
    url: process.env.SEARCH_URL || 'https://searchservice.inf326.nursoft.dev',
    prefix: '/api/search',
    pathRewrite: '',
    description: 'Servicio de búsqueda e indexación'
  },

  // Chatbot de Wikipedia (Grupo 12)
  chatbotWikipedia: {
    url: process.env.CHATBOT_WIKIPEDIA_URL || 'http://wikipedia-chatbot-134-199-176-197.nip.io',
    prefix: '/api/chatbot/wikipedia',
    pathRewrite: '',
    description: 'Chatbot de consultas a Wikipedia'
  },

  // Chatbot de Programación (Grupo 13)
  chatbotProgramming: {
    url: process.env.CHATBOT_PROGRAMMING_URL || 'https://chatbotprogra.inf326.nursoft.dev',
    prefix: '/api/chatbot/programming',
    pathRewrite: '',
    description: 'Chatbot de ayuda en programación'
  }
};
