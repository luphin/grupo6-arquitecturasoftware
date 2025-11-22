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

// Define la URL BASE de tu API Gateway
const API_GATEWAY_URL = 'https://users.inf326.nursoft.dev/v1';


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
    
    const loginUrl = `${API_GATEWAY_URL}/auth/login`;

    const payload = {
      username_or_email: email, 
      password: password,
    };
        
    try {
      // 1. Llamada al API Gateway (ahora apuntando al host users.inf326...)
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
        const errorDetail = await response.json();
        throw new Error(errorDetail.detail || 'Credenciales inválidas. Intenta de nuevo.');
      }

      // 3. Procesar respuesta exitosa (200 OK)
      const data = await response.json();
            
      // 4. Mapear y guardar el usuario (ajustamos el status al tipo corregido)
      const authenticatedUser: User = { 
          id: data.userId || 'temp-id', 
          username: data.username || email.split('@')[0], 
          email: data.email || email,
          status: 'online', // Usamos 'online' por defecto para el estado inicial de login
          createdAt: new Date(), 
      };

      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      
    } catch (error) {
      // Re-lanza el error para que LoginForm lo capture y detenga la redirección
      throw error; 
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
