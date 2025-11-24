'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Channel, Thread } from '@/types';
import { ChannelAccordion } from '../channels/ChannelAccordion';
import { ChannelSearch } from '../channels/ChannelSearch';
import { ProfileView } from './ProfileView';
import { SettingsView } from './SettingsView';
import { useAuth } from '@/lib/AuthContext';

// 1. DEFINICIÓN DE LOS BOTS
const AVAILABLE_BOTS = [
  { 
    id: 'bot-wikipedia', 
    name: 'Wikipedia Chatbot', 
    description: 'Ayuda con búsquedas',
    color: 'bg-blue-100 text-blue-600'
  },
  { 
    id: 'bot-programacion', 
    name: 'Programación Chatbot', 
    description: 'Preguntas generales y ayuda',
    color: 'bg-green-100 text-green-600'
  }
];

interface ChatbotsViewProps {
  onSelect: (id: string, name: string) => void;
  selectedId?: string;
}

const ChatbotsView = ({ onSelect, selectedId }: ChatbotsViewProps) => (
  <div className="flex flex-col h-full">
    <div className="p-4 pb-2">
      <h2 className="text-lg font-bold text-foreground">Mis Chatbots</h2>
      <p className="text-xs text-muted-foreground">Selecciona un asistente para conversar</p>
    </div>
    
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {AVAILABLE_BOTS.map((bot) => {
        const isSelected = selectedId === bot.id;
        
        return (
          <button
            key={bot.id}
            onClick={() => onSelect(bot.id, bot.name)}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group border
              ${isSelected 
                ? 'bg-[#00839B]/10 text-[#00839B] border-[#00839B]/20 shadow-sm' 
                : 'bg-transparent border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
          >
            {/* Icono (SVG) */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'} ${bot.color}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={`font-medium truncate ${isSelected ? 'font-semibold' : ''}`}>
                {bot.name}
              </div>
              <div className={`text-xs truncate transition-colors ${isSelected ? 'text-[#00839B]/80' : 'text-muted-foreground group-hover:text-muted-foreground/80'}`}>
                {bot.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

interface SidebarProps {
  channels: Channel[];
  selectedThreadId?: string;
  // Mantenemos esto para los hilos normales
  onThreadSelect: (thread: Thread) => void;
  // ✅ NUEVA PROP: Específica para seleccionar bots (sin Thread object)
  onBotSelect?: (botId: string, botName: string) => void; 
  // Prop para saber qué bot está seleccionado visualmente
  selectedBotId?: string; 
  
  onCreateChannel?: () => void;
  selectedView: 'channels' | 'search' | 'profile' | 'settings' | 'chatbots';
  onLogout: () => void;
  onChannelJoined?: () => void;
  onChannelSettingsOpen?: (channel: Channel) => void;
}

const SIDEBAR_WIDTH = 350;

export function Sidebar({
  channels,
  selectedThreadId,
  onThreadSelect,
  // Recibimos las nuevas props
  onBotSelect,
  selectedBotId,
  
  onCreateChannel,
  selectedView,
  onLogout,
  onChannelJoined,
  onChannelSettingsOpen,
}: SidebarProps) {
  const { user } = useAuth();

  if (!user) return null;

  const renderContent = () => {
    switch (selectedView) {
      case 'channels':
        return (
          <>
            <div className="p-4 pb-0">
              <h2 className="text-lg font-bold text-muted-foreground">Canales</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ChannelAccordion
                channels={channels}
                selectedThreadId={selectedThreadId}
                onThreadSelect={onThreadSelect}
                user={user}
                onChannelUpdated={onChannelJoined}
                onChannelSettingsOpen={onChannelSettingsOpen}
              />
            </div>
          </>
        );
      
      // ... search, profile, settings quedan igual ...
      case 'search':
         return <ChannelSearch onChannelSelect={() => {}} user={user} onChannelJoined={onChannelJoined} />;
      case 'profile':
         return <ProfileView user={user} />;
      case 'settings':
         return <SettingsView onLogout={onLogout} />;

      case 'chatbots':
        return (
          <ChatbotsView
            // ✅ USO: Llamamos directamente a la función de bots
            onSelect={(id, name) => {
              if (onBotSelect) onBotSelect(id, name);
            }}
            // ✅ USO: Usamos el ID del bot, no del thread
            selectedId={selectedBotId}
          />
        );

      default:
        return null;
    }
  };

  return (
    <aside
      style={{ width: `${SIDEBAR_WIDTH}px` }}
      className="bg-background border-r border-border flex flex-col"
    >
      {renderContent()}
    </aside>
  );
}
