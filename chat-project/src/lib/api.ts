/**
 * API Client - Centraliza todas las llamadas al API Gateway
 */

import { Channel, Thread, Message, MessagesResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Función helper para hacer peticiones al API Gateway
 */
async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Construir URL con query parameters si existen
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      // Intentar obtener el mensaje de error del servidor
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData;
      } catch (parseError) {
        // Si no se puede parsear como JSON, intentar obtener el texto
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
          }
        } catch (textError) {
          // Ignorar si no se puede obtener el texto
        }
      }

      // Crear un error más descriptivo
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      (error as any).endpoint = endpoint;
      (error as any).details = errorDetails;

      console.error('API Request Error:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        details: errorDetails,
      });

      throw error;
    }

    // Intentar parsear la respuesta como JSON
    try {
      return await response.json();
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', {
        endpoint,
        parseError,
      });
      throw new Error(`Failed to parse response from ${endpoint}`);
    }
  } catch (error) {
    // Manejar errores de red (fetch failed)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new Error(
        `Network error: Unable to connect to ${API_BASE_URL}. Please check your connection.`
      );
      (networkError as any).endpoint = endpoint;
      (networkError as any).originalError = error;
      console.error('Network Error:', {
        endpoint,
        baseUrl: API_BASE_URL,
        originalError: error,
      });
      throw networkError;
    }

    // Re-lanzar otros errores
    throw error;
  }
}

// ============================================
// MODERATION API
// ============================================

export const moderationApi = {
  /**
   * Moderar un mensaje
   */
  moderateMessage: async (content: string) => {
    return apiRequest('/api/moderation/moderate', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  /**
   * Obtener historial de moderación
   */
  getModerationHistory: async (messageId: string) => {
    return apiRequest(`/api/moderation/history/${messageId}`, {
      method: 'GET',
    });
  },
};

// ============================================
// USERS API
// ============================================

export const usersApi = {
  /**
   * Login
   */
  login: async (email: string, password: string) => {
    return apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Obtener perfil de usuario
   */
  getProfile: async (userId: string) => {
    return apiRequest(`/api/users/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Actualizar perfil
   */
  updateProfile: async (userId: string, data: any) => {
    return apiRequest(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// CHANNELS API
// ============================================

export const channelsApi = {
  /**
   * Obtener canales del usuario
   */
  getUserChannels: async (userId: string): Promise<Channel[]> => {
    return apiRequest(`/api/channels/members/${userId}`, {
      method: 'GET',
    });
  },

  /**
   * Obtener threads de un canal
   */
  getChannelThreads: async (channelId: string): Promise<Thread[]> => {
      const response = await apiRequest<any[]>(`/api/threads/channel/get_threads?channel_id=${channelId}`, {
        method: 'GET',
      });

      // Mapear la respuesta del backend al formato esperado por el frontend
      return response.map((thread: any) => ({
        thread_id: thread.thread_id,
        uuid: thread.uuid, // <--- NUEVO: Mapeo directo del UUID
        thread_name: thread.title || thread.thread_name, 
        thread_created_by: thread.created_by || thread.thread_created_by,
        channel_id: thread.channel_id,
      }));
    },

  /**
   * Crear un nuevo thread en un canal
   */
    createThread: async (channelId: string, title: string, createdBy: string, metadata?: Record<string, any>): Promise<Thread> => {
    const response = await apiRequest<any>(`/api/threads/threads/threads/?channel_id=${channelId}&thread_name=${title}&user_id=${createdBy}`, {
      method: 'POST',
    });

    // Mapear la respuesta del backend
    return {
      thread_id: response.thread_id,
      uuid: response.uuid, // <--- NUEVO: Asegúrate de capturarlo también al crear
      thread_name: response.title || response.thread_name,
      thread_created_by: response.created_by || response.thread_created_by || createdBy,
      channel_id: response.channel_id || channelId,
    };
  },
};

// ============================================
// MESSAGES API
// ============================================

export const messagesApi = {
  /**
   * Obtener mensajes de un thread
   */
  getThreadMessages: async (uuid: string, cursor?: string): Promise<MessagesResponse> => {
    return apiRequest(`/api/messages/threads/${uuid}/messages`, {
      method: 'GET',
      params: cursor ? { cursor } : undefined,
    });
  },

  /**
   * Enviar mensaje a un thread
   */
  sendMessage: async (
    uuid: string,
    userId: string,
    content: string,
    type: 'text' | 'audio' | 'file' = 'text',
    paths?: string[]
  ): Promise<Message> => {
    return apiRequest(`/api/messages/threads/${uuid}/messages`, {
      method: 'POST',
      headers: {
        'X-User-Id': userId,
      },
      body: JSON.stringify({
        content,
        type,
        paths: paths || []
      }),
    });
  },
};

export default {
  moderation: moderationApi,
  users: usersApi,
  channels: channelsApi,
  messages: messagesApi,
};
