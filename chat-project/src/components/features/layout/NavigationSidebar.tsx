'use client';

import { User } from '@/types';
import { channel } from 'diagnostics_channel';

interface NavigationSidebarProps {
  user: User;
  selectedView: 'channels' | 'search' | 'profile' | 'settings';
  onViewChange: (view: 'channels' | 'search' | 'profile' | 'settings') => void;
}

export function NavigationSidebar({ user, selectedView, onViewChange }: NavigationSidebarProps) {
  return (
    <aside className="w-16 bg-background border-r border-border flex flex-col items-center py-4 gap-2">
      {/* Navigation Icons */}
      <div className="flex-1 flex flex-col gap-2">
          <button
            key="channels"
            onClick={() => onViewChange("channels")}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              selectedView === "channels"
                ? 'bg-muted text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
            title="Chats"
          >
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
						</svg>
          </button>
					<button
            key="search"
            onClick={() => onViewChange("search")}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              selectedView === "search"
                ? 'bg-muted text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
            title="Buscar"
          >
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
          </button>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col gap-2">
        {/* Settings */}
        <button
          onClick={() => onViewChange('settings')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            selectedView === 'settings'
              ? 'bg-muted text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
          title="Configuración"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* User Profile */}
        <button
          onClick={() => onViewChange('profile')}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors overflow-hidden cursor-pointer ${
            selectedView === 'profile'
              ? 'bg-muted text-primary-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
          title="Perfil"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
        </button>
      </div>
    </aside>
  );
}
