'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define la URL BASE de tu API Gateway local
// En desarrollo usa el gateway local, en producción usa la URL directa
const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL;


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Solo verificar si hay token guardado
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Aquí podrías hacer una validación del token si quieres
      // Por ahora solo marcamos como no loading
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const loginUrl = `${API_GATEWAY_URL}/api/users/auth/login`;

    const payload = {
      username_or_email: email,
      password: password,
    };

    try {
      console.log(`[AUTH] Paso 1/3: Autenticando usuario...`);

      // ===== PASO 1: LOGIN =====
      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!loginResponse.ok) {
        const errorDetail = await loginResponse.json().catch(() => ({}));
        throw new Error(errorDetail.detail || errorDetail.message || 'Credenciales inválidas. Intenta de nuevo.');
      }

      const loginData = await loginResponse.json();
      console.log('[AUTH] Login exitoso, obteniendo datos del usuario...');

      // Guardar token si existe
      const token = loginData.token || loginData.access_token;
      if (token) {
        localStorage.setItem('auth_token', token);
      }

      // ===== PASO 2: OBTENER DATOS COMPLETOS DEL USUARIO =====
      console.log(`[AUTH] Paso 2/3: Obteniendo perfil completo...`);

      const meUrl = `${API_GATEWAY_URL}/api/users/users/me`;
      const meResponse = await fetch(meUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!meResponse.ok) {
        console.warn('[AUTH] No se pudo obtener /me, usando datos del login');
        // Si falla /me, usar datos del login
        const fallbackUser: User = {
          id: loginData.userId || loginData.id || 'temp-id',
          username: loginData.username || email.split('@')[0],
          email: loginData.email || email,
          full_name: loginData.full_name || loginData.username || email.split('@')[0],
          is_active: true,
          status: 'online',
        };

        setUser(fallbackUser);

        // Intentar actualizar presencia aunque /me haya fallado
        await updatePresence(fallbackUser.id, 'online', token);

        return;
      }

      const userData = await meResponse.json();
      console.log('[AUTH] Perfil obtenido:', userData);

      // ===== PASO 3: ACTUALIZAR PRESENCIA A ONLINE =====
      console.log(`[AUTH] Paso 3/3: Actualizando presencia a online...`);

      const authenticatedUser: User = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        is_active: userData.is_active,
        status: 'online',
      };

      // Actualizar presencia
      await updatePresence(authenticatedUser.id, 'online', token);

      // Guardar usuario solo en estado (no en localStorage)
      setUser(authenticatedUser);

      console.log('[AUTH] ✅ Login completo exitosamente');

    } catch (error) {
      console.error('[AUTH] ❌ Error en login:', error);
      // Limpiar cualquier dato que se haya guardado
      localStorage.removeItem('auth_token');
      throw error;
    }
  };

  /**
   * Actualiza el estado de presencia del usuario
   */
  const updatePresence = async (
    userId: string,
    status: 'online' | 'offline',
    token?: string
  ) => {
    try {
      const presenceUrl = `${API_GATEWAY_URL}/api/presence/presence/${userId}`;

      const response = await fetch(presenceUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        console.log(`[PRESENCE] ✅ Estado actualizado a: ${status}`);
      } else {
        console.warn(`[PRESENCE] ⚠️ No se pudo actualizar presencia: ${response.status}`);
      }
    } catch (error) {
      console.warn('[PRESENCE] ⚠️ Error al actualizar presencia:', error);
      // No lanzamos el error para que el login no falle por problemas de presencia
    }
  };

  const logout = async () => {
    try {
      if (user) {
        console.log('[AUTH] Cerrando sesión...');

        // Actualizar presencia a offline antes de hacer logout
        const token = localStorage.getItem('auth_token');
        await updatePresence(user.id, 'offline', token || undefined);

        console.log('[AUTH] ✅ Logout completo');
      }
    } catch (error) {
      console.warn('[AUTH] ⚠️ Error al actualizar presencia en logout:', error);
    } finally {
      // Siempre limpiar el estado, incluso si falla la actualización de presencia
      setUser(null);
      localStorage.removeItem('auth_token');
    }
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
