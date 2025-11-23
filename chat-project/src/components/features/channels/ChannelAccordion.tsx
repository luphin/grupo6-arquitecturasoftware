'use client';

import { useState } from 'react';
import { Channel, Thread, User } from '@/types';
import { channelsApi } from '@/lib/api';

interface ChannelAccordionProps {
  channels: Channel[];
  onThreadSelect: (threadId: string, threadName: string) => void;
  selectedThreadId?: string;
  user: User;
  onChannelUpdated?: () => void;
  onChannelSettingsOpen?: (channel: Channel) => void;
}

export function ChannelAccordion({
  channels,
  onThreadSelect,
  selectedThreadId,
  user,
  onChannelUpdated,
  onChannelSettingsOpen,
}: ChannelAccordionProps) {
  const [openChannelId, setOpenChannelId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, Thread[]>>({});
  const [loadingThreads, setLoadingThreads] = useState<Record<string, boolean>>({});

  const toggleChannel = async (channelId: string) => {
    if (openChannelId === channelId) {
      // Cerrar el acordeón actual
      setOpenChannelId(null);
    } else {
      // Abrir nuevo acordeón
      setOpenChannelId(channelId);

      // Cargar threads si no están cargados
      if (!threads[channelId] && !loadingThreads[channelId]) {
        setLoadingThreads(prev => ({ ...prev, [channelId]: true }));
        try {
          const channelThreads = await channelsApi.getChannelThreads(channelId);
          setThreads(prev => ({ ...prev, [channelId]: channelThreads }));
        } catch (error) {
          console.error('Error loading threads:', error);
        } finally {
          setLoadingThreads(prev => ({ ...prev, [channelId]: false }));
        }
      }
    }
  };

  return (
    <>
      <div className="space-y-1">
        {channels.map((channel) => (
          <div key={channel.id}>
            {/* Channel Header - Same style as ChannelList */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleChannel(channel.id)}
                className={`flex-1 text-left px-3 py-2 rounded-md transition-colors cursor-pointer ${openChannelId === channel.id
                  ? 'bg-muted'
                  : 'hover:bg-muted'
                  }`}
              >
                <div className='flex flex-row items-center'>
                  {/* Settings Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onChannelSettingsOpen) {
                        onChannelSettingsOpen(channel);
                      }
                    }}
                    className="p-2 hover:bg-muted rounded-md transition-colors cursor-pointer"
                    title="Configuración del canal"
                  >
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
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-foreground">#</span>
                      <span className="font-medium text-foreground">{channel.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {channel.channel_type === 'private' && (
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
                      <svg
                        className={`w-4 h-4 text-foreground transition-transform ${openChannelId === channel.id ? 'rotate-180' : ''
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {channel.user_count} miembro{channel.user_count !== 1 ? 's' : ''}
                </p>
              </button>

            </div>

            {/* Threads List */}
            {openChannelId === channel.id && (
              <div className="ml-6 mt-1 space-y-1">
                {loadingThreads[channel.id] ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    Cargando chats...
                  </div>
                ) : threads[channel.id]?.length > 0 ? (
                  <>
                    {threads[channel.id].map((thread) => (
                      <button
                        key={thread.thread_id}
                        onClick={() => onThreadSelect(thread.thread_id, thread.thread_name)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors cursor-pointer ${selectedThreadId === thread.thread_id
                          ? 'bg-muted'
                          : 'hover:bg-muted'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">💬</span>
                          <span
                            className={`text-sm ${selectedThreadId === thread.thread_id ? 'font-medium' : ''
                              } text-foreground`}
                          >
                            {thread.thread_name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    No hay chats en este canal
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
