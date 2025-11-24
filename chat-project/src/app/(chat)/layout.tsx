'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationSidebar } from '@/components/features/layout/NavigationSidebar';
import { Sidebar } from '@/components/features/layout/Sidebar';
import { ChannelSettingsSidebar } from '@/components/features/channels/ChannelSettingsSidebar';
import { ThreadSettingsSidebar } from '@/components/features/chat/ThreadSettingsSidebar';
// 1. IMPORTACIÓN
import { ChatbotWindow } from '@/components/features/chatbots/ChatbotWindow';
import { useAuth } from '@/lib/AuthContext';
import { Channel, Thread } from '@/types';
import { channelsApi } from '@/lib/api';

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
  
  // Estados de selección separados para evitar conflictos de API
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [activeBot, setActiveBot] = useState<{id: string, name: string} | null>(null);

  const [selectedView, setSelectedView] = useState<'channels' | 'search' | 'profile' | 'settings' | 'chatbots'>('channels');

  // Estado unificado para el settings sidebar
  const [settingsSidebarType, setSettingsSidebarType] = useState<'channel' | 'thread' | null>(null);
  const [selectedChannelForSettings, setSelectedChannelForSettings] = useState<Channel | null>(null);
  const [selectedThreadForSettings, setSelectedThreadForSettings] = useState<Thread | null>(null);

  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
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

  // 2. MANEJADORES DE SELECCIÓN (Lógica de Exclusión Mutua)
  
  const handleThreadSelect = (thread: Thread) => {
    setActiveBot(null);       // Desactivar bot
    setSelectedThread(thread); // Activar hilo real
  };

  const handleBotSelect = (botId: string, botName: string) => {
    setSelectedThread(null);  // Desactivar hilo real (Evita llamada a API y error 422)
    setActiveBot({ id: botId, name: botName }); // Activar bot
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

  // 3. RENDERIZADO PRINCIPAL
  const renderMainContent = () => {
    // CASO A: Vista de Chatbots
    if (selectedView === 'chatbots') {
      if (activeBot) {
        return (
          <ChatbotWindow 
            botId={activeBot.id} 
            botName={activeBot.name} 
          />
        );
      }
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
          <div className="text-center">
            <p>Selecciona un asistente IA para comenzar a conversar</p>
          </div>
        </div>
      );
    }

    // CASO B: Vista Normal (Canales/Hilos)
    // Solo renderizamos el contexto y children aquí.
    // Al ser selectedThread = null cuando usas bots, el children no intentará cargar nada.
    return (
      <ChatContext.Provider value={{
        selectedThread,
        setSelectedThread,
        onThreadSettingsOpen: handleThreadSettingsOpen
      } as any}>
        {children}
      </ChatContext.Provider>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <NavigationSidebar
          user={user}
          selectedView={selectedView}
          onViewChange={handleViewChange}
        />
        <Sidebar
          channels={channels}
          selectedView={selectedView}
          
          // Props para Hilos Normales
          selectedThreadId={selectedThread?.thread_id}
          onThreadSelect={handleThreadSelect}
          
          // Props para Bots (Nuevas)
          selectedBotId={activeBot?.id}
          onBotSelect={handleBotSelect}

          onCreateChannel={() => console.log('Create channel')}
          onLogout={logout}
          onChannelJoined={loadChannels}
          onChannelSettingsOpen={handleChannelSettingsOpen}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
          {renderMainContent()}
        </main>

        {/* Settings Sidebars */}
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
            }}
          />
        )}
      </div>
    </div>
  );
}
