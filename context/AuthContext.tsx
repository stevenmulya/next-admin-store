"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  level: string | number;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const token = getCookie('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData: any = await api.get('/users/profile');
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          level: userData.role || userData.level,
        });
      } catch (error) {
        deleteCookie('token', { path: '/' });
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = (token: string, userData: User) => {
    setCookie('token', token, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    setUser(userData);
    router.replace('/dashboard');
  };

  const logout = () => {
    deleteCookie('token', { path: '/' });
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth error');
  return context;
};