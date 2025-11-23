'use client';

import { User } from '@/types';

interface ProfileViewProps {
  user: User;
}

export function ProfileView({ user }: ProfileViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Perfil</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* User Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-3xl mb-4">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-foreground">{user.full_name}</h3>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>

        {/* User Info */}
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Email</p>
            <p className="text-sm text-foreground">{user.email}</p>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Estado</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                user.status === 'online' ? 'bg-green-500' :
                user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
              <p className="text-sm text-foreground capitalize">{user.status}</p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">ID de Usuario</p>
            <p className="text-xs text-foreground font-mono break-all">{user.id}</p>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Cuenta Activa</p>
            <p className="text-sm text-foreground">{user.is_active ? 'Sí' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
