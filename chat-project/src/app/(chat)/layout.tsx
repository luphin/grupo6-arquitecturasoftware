'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationSidebar } from '@/components/features/layout/NavigationSidebar';
import { Sidebar } from '@/components/features/layout/Sidebar';
import { ChannelSettingsSidebar } from '@/components/features/channels/ChannelSettingsSidebar';
import { ThreadSettingsSidebar } from '@/components/features/chat/ThreadSettingsSidebar';
import { useAuth } from '@/lib/AuthContext';
import { Channel, Thread } from '@/types';
import { channelsApi } from '@/lib/api';

// Context para compartir el thread seleccionado entre Sidebar y las páginas
interface ChatContextType {
  selectedThread: Thread | null;
  setSelectedThread: (thread: Thread | null) => void;
  onThreadSettingsOpen?: (thread: Thread) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatLayout');
  }
  return context;
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [selectedView, setSelectedView] = useState<'channels' | 'search' | 'profile' | 'settings' | 'chatbots'>('channels');

  // Estado unificado para el settings sidebar
  const [settingsSidebarType, setSettingsSidebarType] = useState<'channel' | 'thread' | null>(null);
  const [selectedChannelForSettings, setSelectedChannelForSettings] = useState<Channel | null>(null);
  const [selectedThreadForSettings, setSelectedThreadForSettings] = useState<Thread | null>(null);

  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadChannels();
    }
  }, [user]);

  const loadChannels = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userChannels = await channelsApi.getUserChannels(user.id);
      setChannels(userChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread);
  };

  const handleViewChange = (view: 'channels' | 'search' | 'profile' | 'settings' | 'chatbots') => {
    setSelectedView(view);
  };

  const handleChannelSettingsOpen = (channel: Channel) => {
    setSettingsSidebarType('channel');
    setSelectedChannelForSettings(channel);
    setSelectedThreadForSettings(null);
  };

  const handleThreadSettingsOpen = (thread: Thread) => {
    setSettingsSidebarType('thread');
    setSelectedThreadForSettings(thread);
    setSelectedChannelForSettings(null);
  };

  const handleSettingsSidebarClose = () => {
    setSettingsSidebarType(null);
    setSelectedChannelForSettings(null);
    setSelectedThreadForSettings(null);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <ChatContext.Provider value={{ selectedThread, setSelectedThread }}>
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <NavigationSidebar
            user={user}
            selectedView={selectedView}
            onViewChange={handleViewChange}
          />
          <Sidebar
            channels={channels}
            selectedThreadId={selectedThread?.thread_id}
            onThreadSelect={handleThreadSelect}
            onCreateChannel={() => console.log('Create channel')}
            selectedView={selectedView}
            onLogout={logout}
            onChannelJoined={loadChannels}
            onChannelSettingsOpen={handleChannelSettingsOpen}
          />
          <main className="flex-1 flex flex-col overflow-hidden">
            <ChatContext.Provider value={{
              selectedThread,
              setSelectedThread,
              onThreadSettingsOpen: handleThreadSettingsOpen
            } as any}>
              {children}
            </ChatContext.Provider>
          </main>

          {/* Settings Sidebar unificado */}
          {settingsSidebarType === 'channel' && selectedChannelForSettings && (
            <ChannelSettingsSidebar
              channel={selectedChannelForSettings}
              user={user}
              isOpen={true}
              onClose={handleSettingsSidebarClose}
              onChannelUpdated={() => {
                handleSettingsSidebarClose();
                loadChannels();
              }}
            />
          )}

          {settingsSidebarType === 'thread' && selectedThreadForSettings && (
            <ThreadSettingsSidebar
              thread={selectedThreadForSettings}
              user={user}
              isOpen={true}
              onClose={handleSettingsSidebarClose}
              onThreadUpdated={() => {
                handleSettingsSidebarClose();
                // Opcionalmente recargar mensajes o threads
              }}
            />
          )}
        </div>
      </div>
    </ChatContext.Provider>
  );
}
