import React from 'react';
import { Channel } from '@/types';
import { ChannelSkeleton } from '@/components/ui/Skeleton';

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  isLoading?: boolean;
}

export function ChannelList({
  channels,
  selectedChannelId,
  onChannelSelect,
  isLoading = false,
}: ChannelListProps) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(5)].map((_, i) => (
          <ChannelSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {channels.map((channel) => (
        <button
          key={channel.id}
          onClick={() => onChannelSelect(channel.id)}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors cursor-pointer ${
            selectedChannelId === channel.id
              ? 'bg-muted'
              : 'hover:bg-muted'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg text-foreground">#</span>
              <span className="font-medium text-foreground">{channel.name}</span>
            </div>
            {channel.type === 'private' && (
              <svg
                className="w-4 h-4 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            )}
          </div>
          {channel.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {channel.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
