'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Channel } from '@/types';
import { ChannelAccordion } from '../channels/ChannelAccordion';
import { ChannelSearch } from '../channels/ChannelSearch';
import { ProfileView } from './ProfileView';
import { SettingsView } from './SettingsView';
import { Button } from '@/components/ui/Button';
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
            {/* Icono del Bot (SVG Manual) */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'} ${bot.color}`}>
              {/* ✅ REEMPLAZADO: SVG directo en lugar de MessageSquare */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            
            {/* Info del Bot */}
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

// --- EL RESTO DEL ARCHIVO SIGUE IGUAL ---
interface SidebarProps {
  channels: Channel[];
  selectedThreadId?: string;
  onThreadSelect: (threadId: string, threadName: string) => void;
  onCreateChannel?: () => void;
  selectedView: 'channels' | 'search' | 'profile' | 'settings' | 'chatbots';
  onLogout: () => void;
  onChannelJoined?: () => void;
  onChannelSettingsOpen?: (channel: Channel) => void;
}

const MIN_WIDTH = 230;
const MAX_WIDTH = 350;
const DEFAULT_WIDTH = 256;

export function Sidebar({
  channels,
  selectedThreadId,
  onThreadSelect,
  onCreateChannel,
  selectedView,
  onLogout,
  onChannelJoined,
  onChannelSettingsOpen,
}: SidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) {
        setWidth(parsedWidth);
      }
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
        localStorage.setItem('sidebar-width', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  if (!user) {
    return null;
  }

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
      case 'search':
        return <ChannelSearch onChannelSelect={onThreadSelect} user={user} onChannelJoined={onChannelJoined} />;
      
      case 'chatbots':
        return (
          <ChatbotsView 
            onSelect={onThreadSelect} 
            selectedId={selectedThreadId} 
          />
        );

      case 'profile':
        return <ProfileView user={user} />;
      case 'settings':
        return <SettingsView onLogout={onLogout} />;
      default:
        return null;
    }
  };

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="bg-background border-r border-border flex flex-col relative"
    >
      {renderContent()}

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary transition-colors group"
      >
        <div className="absolute top-0 right-0 w-1 h-full group-hover:w-1 group-hover:bg-primary" />
      </div>
    </aside>
  );
}
