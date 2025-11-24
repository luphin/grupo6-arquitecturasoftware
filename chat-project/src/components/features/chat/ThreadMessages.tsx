'use client';

import { useState, useEffect } from 'react';
import { Message, MessagesResponse, Thread } from '@/types';
import { messagesApi } from '@/lib/api';
import { ChatInput } from './ChatInput';
import { useAuth } from '@/lib/AuthContext';
import { useChatContext } from '@/app/(chat)/layout';

interface ThreadMessagesProps {
  thread: Thread;
}

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
    try {
      setLoading(true);
      const response: MessagesResponse = await messagesApi.getThreadMessages(thread.thread_id, cursor);

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
      const newMessage = await messagesApi.sendMessage(
        thread.thread_id,
        user.id,
        content,
        'text'
      );

      // Agregar el nuevo mensaje a la lista
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje. Por favor intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No hay mensajes en este chat</p>
            <p className="text-sm mt-2">Sé el primero en enviar un mensaje</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                {/* Message Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {message.user_id.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{message.user_id}</p>
                      <p className="text-xs text-gray-500">{formatDate(message.updated_at)}</p>
                    </div>
                  </div>
                  {message.type !== 'text' && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {message.type}
                    </span>
                  )}
                </div>

                {/* Message Content */}
                <div className="text-gray-800 text-sm whitespace-pre-wrap pl-10">
                  {message.content}
                </div>

                {/* Attachments */}
                {message.paths && message.paths.length > 0 && message.paths[0] !== 'string' && (
                  <div className="mt-3 pl-10">
                    <div className="flex flex-wrap gap-2">
                      {message.paths.map((path, index) => (
                        <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                          📎 {path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => loadMessages(nextCursor || undefined)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Cargando...' : 'Cargar más mensajes'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={sending || !user}
        placeholder={sending ? 'Enviando...' : 'Escribe un mensaje...'}
      />
    </div>
  );
}
