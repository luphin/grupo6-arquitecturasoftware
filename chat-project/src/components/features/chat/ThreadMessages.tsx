'use client';

import { useState, useEffect } from 'react';
import { Message, MessagesResponse } from '@/types';
import { messagesApi } from '@/lib/api';

interface ThreadMessagesProps {
  threadId: string;
  threadName: string;
}

export function ThreadMessages({ threadId, threadName }: ThreadMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [threadId]);

  const loadMessages = async (cursor?: string) => {
    try {
      setLoading(true);
      const response: MessagesResponse = await messagesApi.getThreadMessages(threadId, cursor);

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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">{threadName}</h2>
        <p className="text-sm text-gray-500">{messages.length} mensaje{messages.length !== 1 ? 's' : ''}</p>
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
    </div>
  );
}
