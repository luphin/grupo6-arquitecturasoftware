'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Channel } from '@/types';
import { ChannelAccordion } from '../channels/ChannelAccordion';
import { ChannelSearch } from '../channels/ChannelSearch';
import { ProfileView } from './ProfileView';
import { SettingsView } from './SettingsView';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/features/layout/Navbar';
import { useAuth } from '@/lib/AuthContext';

interface SidebarProps {
  channels: Channel[];
  selectedThreadId?: string;
  onThreadSelect: (threadId: string, threadName: string) => void;
  onCreateChannel?: () => void;
  selectedView: 'channels' | 'search' | 'profile' | 'settings';
  onLogout: () => void;
  onChannelJoined?: () => void; // Callback para refrescar canales
  onChannelSettingsOpen?: (channel: Channel) => void; // Callback para abrir settings
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
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Cargar ancho guardado en localStorage
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
