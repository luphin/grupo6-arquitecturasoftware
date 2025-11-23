'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Asumimos que la interfaz User ahora se importa desde un archivo central para evitar conflictos
// import { User } from '@/types'; 


// ⚠️ FIX CRÍTICO: La interfaz debe coincidir con la definición de tu Navbar
// Se asume que el tipo válido es 'away', ya que 'busy' causaba el conflicto.
interface User {
  id: string;
  username: string;
  email: string;
  status: 'online' | 'offline' | 'away'; // <-- Unificamos el tipo 'status'
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define la URL BASE de tu API Gateway local
// En desarrollo usa el gateway local, en producción usa la URL directa
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL;


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lógica para verificar sesión en localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Llama al API Gateway local que redirige a users.inf326.nur.dev
    const loginUrl = `${API_GATEWAY_URL}/api/users/auth/login`;

    const payload = {
      username_or_email: email,
      password: password,
    };

    try {
      console.log(`[AUTH] Llamando a: ${loginUrl}`);

      // 1. Llamada al API Gateway local
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // 2. Manejo de errores HTTP (401/403)
      if (!response.ok) {
        // Lee el mensaje de error para lanzarlo al LoginForm
        const errorDetail = await response.json().catch(() => ({}));
        throw new Error(errorDetail.detail || errorDetail.message || 'Credenciales inválidas. Intenta de nuevo.');
      }

      // 3. Procesar respuesta exitosa (200 OK)
      const data = await response.json();

      console.log('[AUTH] Login exitoso:', data);

      // 4. Mapear y guardar el usuario
      const authenticatedUser: User = {
          id: data.userId || data.id || 'temp-id',
          username: data.username || email.split('@')[0],
          email: data.email || email,
          status: 'online', // Estado online después del login
          createdAt: new Date(data.createdAt || Date.now()),
      };

      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));

      // Guardar token si existe
      if (data.token || data.access_token) {
        localStorage.setItem('auth_token', data.token || data.access_token);
      }

    } catch (error) {
      console.error('[AUTH] Error en login:', error);
      // Re-lanza el error para que LoginForm lo capture y detenga la redirección
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
