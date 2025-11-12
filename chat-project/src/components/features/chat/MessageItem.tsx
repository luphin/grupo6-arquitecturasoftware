import React from 'react';
import { Message } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface MessageItemProps {
  message: Message;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageItem({ message, onEdit, onDelete }: MessageItemProps) {
  if (!message.user) return null;

  const isSystemMessage = message.type === 'system';
  const isFlagged = message.moderationStatus === 'flagged';
  const isRemoved = message.moderationStatus === 'removed';

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
        <Avatar user={message.user} size="md" showStatus />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground">
              {message.user.username}
            </span>
            <span className="text-xs text-foreground">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
            {message.isEdited && (
              <span className="text-xs text-foreground">(edited)</span>
            )}
            {isFlagged && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                Flagged
              </span>
            )}
          </div>
          <div className="mt-1">
            {isRemoved ? (
              <p className="text-sm text-muted-foreground italic">
                This message has been removed by moderation
              </p>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.fileUrl}
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
                  {attachment.fileName}
                </a>
              ))}
            </div>
          )}
          {!isRemoved && (onEdit || onDelete) && (
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
