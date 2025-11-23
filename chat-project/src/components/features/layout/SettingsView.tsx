'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { FaMoon, FaSun } from "react-icons/fa";

interface SettingsViewProps {
  onLogout: () => void;
}

export function SettingsView({ onLogout }: SettingsViewProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Configuración</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {/* Settings Options */}
          <button className="w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-muted">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-foreground">Preferencias</span>
            </div>
          </button>

					 
          <button className="w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-muted">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-foreground">Notificaciones</span>
            </div>
          </button>

          <button className="w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-muted">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-foreground">Privacidad</span>
            </div>
          </button>

          {/* Apariencia con Theme Switch */}
          <div className="w-full px-3 py-2 rounded-md transition-colors hover:bg-muted">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-foreground">Apariencia</span>
              </div>
              {/* Custom Theme Switch con Tailwind */}
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-14 items-center rounded-full transition-colors cursor-pointer ${
                  isDark ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={isDark}
              >
                <span
                  className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-7' : 'translate-x-1'
                  }`}
                >
                  {isDark ? (
                    <FaSun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <FaMoon className="h-4 w-4 text-gray-400" />
                  )}
                </span>
              </button>
            </div>
          </div>

          <button className="w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-muted">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-foreground">Acerca de</span>
            </div>
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
