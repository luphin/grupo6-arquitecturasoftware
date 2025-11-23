import React from 'react';
import { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageItem({ message, onEdit, onDelete }: MessageItemProps) {
  const isSystemMessage = message.type === 'system';

  if (isSystemMessage) {
    return (
      <div className="px-4 py-2 text-center text-sm text-muted-foreground">
        {message.content}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 hover:bg-muted transition-colors group cursor-pointer">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
          {message.user_id.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground">
              User {message.user_id}
            </span>
            <span className="text-xs text-foreground">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div className="mt-1">
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          {message.paths && message.paths.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.paths.map((path, index) => (
                <a
                  key={index}
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <svg
                    className="w-4 h-4"
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
                  File {index + 1}
                </a>
              ))}
            </div>
          )}
          {(onEdit || onDelete) && (
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(message.id)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="text-xs text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
