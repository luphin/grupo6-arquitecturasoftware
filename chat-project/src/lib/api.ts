/**
 * API Client - Centraliza todas las llamadas al API Gateway
 */

import { Channel, Thread, Message, MessagesResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
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
    return apiRequest(`/api/threads/channels/${channelId}`, {
      method: 'GET',
    });
  },
};

// ============================================
// MESSAGES API
// ============================================

export const messagesApi = {
  /**
   * Obtener mensajes de un thread
   */
  getThreadMessages: async (threadId: string, cursor?: string): Promise<MessagesResponse> => {
    return apiRequest(`/api/messages/threads/${threadId}/messages`, {
      method: 'GET',
      params: cursor ? { cursor } : undefined,
    });
  },

  /**
   * Enviar mensaje a un thread
   */
  sendMessage: async (threadId: string, content: string): Promise<Message> => {
    return apiRequest(`/api/messages/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, type: 'text' }),
    });
  },
};

export default {
  moderation: moderationApi,
  users: usersApi,
  channels: channelsApi,
  messages: messagesApi,
};
