import React, { useState } from 'react';
import { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageItem({ message, currentUserId, onEdit, onDelete }: MessageItemProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const isSystemMessage = message.type === 'system';
  const isOwnMessage = message.user_id === currentUserId;

  if (isSystemMessage) {
    return (
      <div className="px-6 py-3 text-center">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`px-6 py-2 flex group hover:bg-muted/30 transition-colors ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-2 max-w-[75%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm ${
          isOwnMessage
            ? 'bg-gradient-to-br from-primary to-primary/80'
            : 'bg-gradient-to-br from-blue-500 to-blue-600'
        }`}>
          {message.user_id.substring(0, 2).toUpperCase()}
        </div>

        <div className="flex flex-col min-w-0">
          {/* Message Content */}
          <div className={`flex flex-col rounded-2xl shadow-sm border ${
            isOwnMessage
              ? 'bg-primary/10 border-primary/20 rounded-br-md'
              : 'bg-background border-border rounded-bl-md'
          }`}>
            {/* Header with name and time */}
            {!isOwnMessage && (
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <span className="text-xs font-semibold text-foreground">
                  User {message.user_id}
                </span>
              </div>
            )}

            {/* Message text */}
            <div className="px-4 py-2">
              <p className={`text-sm whitespace-pre-wrap break-words ${
                isOwnMessage ? 'text-foreground' : 'text-foreground'
              }`}>
                {message.content}
              </p>
            </div>

            {/* Attachments */}
            {message.paths && message.paths.length > 0 && message.paths[0] !== 'string' && (
              <div className="px-4 pb-2 space-y-1.5">
                {message.paths.map((path, index) => (
                  <a
                    key={index}
                    href={path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 hover:underline p-2 bg-muted/50 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span className="truncate">File {index + 1}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Time */}
            <div className={`px-4 pb-2 flex items-center gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Dropdown Menu Button */}
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-1 focus:outline-none transition-colors"
            type="button"
            title="Más opciones"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                d="M12 6h.01M12 12h.01M12 18h.01"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-8 z-20 bg-background border border-border rounded-lg shadow-xl w-44 overflow-hidden`}>
                <ul className="py-1">
                  <li>
                    <button
                      className="block w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => {
                        setShowDropdown(false);
                        // Add reply functionality here
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>Responder</span>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button
                      className="block w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => {
                        setShowDropdown(false);
                        navigator.clipboard.writeText(message.content);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copiar</span>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button
                      className="block w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => {
                        setShowDropdown(false);
                        // Add forward functionality here
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span>Reenviar</span>
                      </div>
                    </button>
                  </li>
                  <div className="my-1 border-t border-border" />
                  {onDelete && (
                    <li>
                      <button
                        className="block w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger-soft transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
                            onDelete(message.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Eliminar</span>
                        </div>
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
