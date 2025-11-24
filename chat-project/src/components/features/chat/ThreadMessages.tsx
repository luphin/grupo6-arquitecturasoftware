'use client';

import { useState, useEffect } from 'react';
import { Message, MessagesResponse, Thread } from '@/types';
import { messagesApi } from '@/lib/api';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { useAuth } from '@/lib/AuthContext';
import { useChatContext } from '@/app/(chat)/layout';

interface ThreadMessagesProps {
  thread: Thread;
}

// URL base de la API (usar variable de entorno o fallback)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function ThreadMessages({ thread }: ThreadMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { onThreadSettingsOpen } = useChatContext();

  useEffect(() => {
    loadMessages();
  }, [thread.thread_id]);

  const loadMessages = async (cursor?: string) => {
    // Evitar cargar mensajes si es un bot (para prevenir error 422)
    if (thread.thread_id.startsWith('bot-')) {
        setMessages([]);
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      const response: MessagesResponse = await messagesApi.getThreadMessages(thread.uuid, cursor);

      if (cursor) {
        // Cargar más mensajes (append)
        setMessages(prev => [...prev, ...response.items]);
      } else {
        // Primera carga
        setMessages(response.items);
      }

      setHasMore(response.has_more);
      setNextCursor(response.next_cursor);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      setSending(true);

      // 1. 🛡️ LLAMADA AL SERVICIO DE MODERACIÓN
      const moderationResponse = await fetch(`${API_BASE_URL}/api/moderation/moderation/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          channel_id: thread.channel_id, 
          message_id: `temp-${Date.now()}`, 
          user_id: user.id,
          metadata: {
            thread_id: thread.thread_id,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!moderationResponse.ok) {
        throw new Error('Error al conectar con el servicio de moderación');
      }

      const moderationData = await moderationResponse.json();

// 2. 🚨 VERIFICAR SI FUE APROBADO
      if (moderationData.is_approved === false) {
        // Crear mensaje de sistema con la advertencia
        const warningMessage = {
          id: `sys-${Date.now()}`,
          content: `⚠️ Mensaje bloqueado por moderación: ${moderationData.message}`,
          
          // ✅ CORRECCIÓN: Usar las propiedades correctas de tu tipo Message
          user_id: 'system', // Antes decía sender_id
          username: 'Moderador', // Antes decía sender_name (asumiendo que usas username)
          
          created_at: new Date().toISOString(),
          thread_id: thread.uuid,
          content_type: 'text',
          is_edited: false,
          reactions: []
        } as unknown as Message;
        
        setMessages(prev => [...prev, warningMessage]);
        return; 
      }

      // 3. ✅ CASO APROBADO: Enviar mensaje real a la API
      const newMessage = await messagesApi.sendMessage(
        thread.uuid,
        user.id,
        content,
        'text'
      );

      // Agregar el nuevo mensaje a la lista
      setMessages(prev => [...prev, newMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al procesar el mensaje. Por favor intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="bg-background border-b border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{thread.thread_name}</h2>
            <p className="text-sm text-muted-foreground">{messages.length} mensaje{messages.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => onThreadSettingsOpen?.(thread)}
            className="p-2 hover:bg-muted rounded-md transition-colors cursor-pointer"
            title="Configuración del hilo"
          >
            <svg
              className="w-5 h-5 text-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={user.id}
        isLoading={loading && messages.length === 0}
      />

      {/* Load More Button */}
      {hasMore && messages.length > 0 && (
        <div className="px-4 pb-4 border-t border-border">
          <button
            onClick={() => loadMessages(nextCursor || undefined)}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Cargando...' : 'Cargar más mensajes'}
          </button>
        </div>
      )}

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={sending || !user}
        placeholder={sending ? 'Enviando...' : 'Escribe un mensaje...'}
      />
    </div>
  );
}
