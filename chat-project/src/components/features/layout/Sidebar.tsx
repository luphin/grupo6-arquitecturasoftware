'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Channel } from '@/types';
import { ChannelList } from '../channels/ChannelList';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
  channels: Channel[];
  selectedChannelId?: string;
  onChannelSelect: (channelId: string) => void;
  onCreateChannel?: () => void;
}

const MIN_WIDTH = 230;
const MAX_WIDTH = 350;
const DEFAULT_WIDTH = 256;

export function Sidebar({
  channels,
  selectedChannelId,
  onChannelSelect,
  onCreateChannel,
}: SidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="bg-background border-r border-border flex flex-col relative"
    >
      <div className="p-4 pb-0">
        <h2 className="text-lg font-bold text-muted-foreground">Canales</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <ChannelList
          channels={channels}
          selectedChannelId={selectedChannelId}
          onChannelSelect={onChannelSelect}
        />
      </div>
      {onCreateChannel && (
        <div className="p-4 border-t border-border">
          <Button
            onClick={onCreateChannel}
            variant="primary"
            size="sm"
            className="w-full"
          >
            + Create Channel
          </Button>
        </div>
      )}

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
