"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    minLevel?: number;
}

export default function ProtectedRoute({ children, minLevel = 1 }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (user.level < minLevel) {
                router.replace('/dashboard');
            }
        }
    }, [user, loading, minLevel, router]);

    if (loading || !user || (user && user.level < minLevel)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={40} className="animate-spin text-blue-600" />
                    <p className="text-slate-500 font-medium">Verifying access...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}