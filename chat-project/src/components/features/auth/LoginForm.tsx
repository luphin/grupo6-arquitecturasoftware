'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/AuthContext';

interface PresenceStats {
  total: number;
  online: number;
  offline: number;
}

// TODO: es el auth base
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [presenceStats, setPresenceStats] = useState<PresenceStats | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  // Fetch presence stats on component mount and every 30 seconds
  useEffect(() => {
    const fetchPresenceStats = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/presence/presence/stats`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setPresenceStats(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching presence stats:', error);
      }
    };

    fetchPresenceStats();
    const interval = setInterval(fetchPresenceStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        setError('Complete todos los campos');
        setIsLoading(false);
        return;
      }

      // Call login function from AuthContext
      await login(email, password);

      // Redirect to channels page
      router.push('/channels');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black mb-2">
            Bienvenido!
          </h1>
          <p className="text-gray-600">Inicia sesión para ingresar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email"
            placeholder="Ingresar mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className='text-gray-800'
          />

          <Input
            type="password"
            label="Contraseña"
            placeholder="Ingresar contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className='text-gray-800'
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>

        {/* Presence Statistics */}
        {presenceStats && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6">
              {/* Online Users */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 opacity-75 animate-ping" />
                </div>
                <span className="text-sm text-gray-600">
                  {presenceStats.online} online
                </span>
              </div>

              {/* Offline Users */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">
                  {presenceStats.offline} offline
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
