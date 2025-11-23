'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationSidebar } from '@/components/features/layout/NavigationSidebar';
import { Sidebar } from '@/components/features/layout/Sidebar';
import { ChannelSettingsSidebar } from '@/components/features/channels/ChannelSettingsSidebar';
import { useAuth } from '@/lib/AuthContext';
import { Channel } from '@/types';
import { channelsApi } from '@/lib/api';

// Context para compartir el thread seleccionado entre Sidebar y las páginas
interface ChatContextType {
  selectedThread: { id: string; name: string } | null;
  setSelectedThread: (thread: { id: string; name: string } | null) => void;
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
  const [selectedThread, setSelectedThread] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedView, setSelectedView] = useState<'channels' | 'search' | 'profile' | 'settings'>('channels');
  const [selectedChannelForSettings, setSelectedChannelForSettings] = useState<Channel | null>(null);
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

  const handleThreadSelect = (threadId: string, threadName: string) => {
    setSelectedThread({ id: threadId, name: threadName });
  };

  const handleViewChange = (view: 'channels' | 'search' | 'profile' | 'settings') => {
    setSelectedView(view);
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
            selectedThreadId={selectedThread?.id}
            onThreadSelect={handleThreadSelect}
            onCreateChannel={() => console.log('Create channel')}
            selectedView={selectedView}
            onLogout={logout}
            onChannelJoined={loadChannels}
            onChannelSettingsOpen={setSelectedChannelForSettings}
          />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
          {selectedChannelForSettings && (
            <ChannelSettingsSidebar
              channel={selectedChannelForSettings}
              user={user}
              isOpen={!!selectedChannelForSettings}
              onClose={() => setSelectedChannelForSettings(null)}
              onChannelUpdated={() => {
                setSelectedChannelForSettings(null);
                loadChannels();
              }}
            />
          )}
        </div>
      </div>
    </ChatContext.Provider>
  );
}
