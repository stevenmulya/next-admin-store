"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export interface User {
    id: number;
    name: string;
    email: string;
    level: number; 
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
            if (token) {
                try {
                    const response = await api.get('/users/profile');
                    const userData = response.data.data; 
                    setUser(userData);
                } catch (error) {
                    deleteCookie('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = (token: string, userData: User) => {
        setCookie('token', token, { 
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
            sameSite: 'lax'
        });
        setUser(userData);
        router.replace('/dashboard');
    };

    const logout = () => {
        deleteCookie('token');
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
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};