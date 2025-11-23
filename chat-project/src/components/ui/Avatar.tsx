import React from 'react';
import { User } from '@/types';

interface AvatarProps {
  user: Pick<User, 'username' | 'status'> & { avatar?: string };
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

export function Avatar({ user, size = 'md', showStatus = false }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
  };

  const initials = user.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-block">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full bg-blue-500 text-white flex items-center justify-center font-medium`}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-background ${
            statusColors[user.status]
          }`}
        />
      )}
    </div>
  );
}
