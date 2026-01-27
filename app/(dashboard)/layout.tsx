"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
    LayoutDashboard, 
    Package, 
    Users, 
    LogOut, 
    Settings, 
    Command, 
    Tags 
} from 'lucide-react';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    const navigation = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Products', href: '/dashboard/products', icon: Package },
        { name: 'Categories', href: '/dashboard/categories', icon: Tags },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Command size={20} color="#ffffff" />
                    <span className={styles.brandName}>Admin Portal</span>
                </div>

                <nav className={styles.nav}>
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        
                        // LOGIKA BARU: 
                        // Jika href adalah root dashboard, harus sama persis.
                        // Jika menu lain, gunakan startsWith agar sub-halaman tetap aktif.
                        const isActive = item.href === '/dashboard' 
                            ? pathname === '/dashboard' 
                            : pathname.startsWith(item.href);
                        
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                            >
                                <Icon size={18} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userProfile}>
                        <p className={styles.userName}>{user?.name || 'Administrator'}</p>
                        <p className={styles.userEmail}>{user?.email}</p>
                    </div>
                    
                    <button onClick={logout} className={styles.logoutBtn}>
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}