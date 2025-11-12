'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/features/layout/Navbar';
import { Sidebar } from '@/components/features/layout/Sidebar';
import { useAuth } from '@/lib/AuthContext';

// TODO: Mock data - esto se reemplazara con datos reales de la API
const mockChannels = [
  {
    id: '1',
    name: 'general',
    description: 'General discussion',
    type: 'public' as const,
    createdBy: '1',
    createdAt: new Date(),
    memberCount: 10,
  },
  {
    id: '2',
    name: 'arquitectura-software',
    description: 'Software Architecture course',
    type: 'public' as const,
    createdBy: '1',
    createdAt: new Date(),
    memberCount: 25,
  },
];

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedChannelId, setSelectedChannelId] = useState<string>();
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

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
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          channels={mockChannels}
          selectedChannelId={selectedChannelId}
          onChannelSelect={setSelectedChannelId}
          onCreateChannel={() => console.log('Create channel')}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
      		<Navbar user={user} onLogout={logout} />
          {children}
        </main>
      </div>
    </div>
  );
}
