"use client";

import React, { useState, useEffect } from 'react';
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
    Tags,
    Sliders,
    ChevronDown, 
    ChevronRight 
} from 'lucide-react';
import styles from './layout.module.css';

type NavItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    children?: NavItem[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    const navigation: NavItem[] = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { 
            name: 'Products', 
            href: '/dashboard/products', 
            icon: Package,
            children: [
                { name: 'Categories', href: '/dashboard/categories', icon: Tags },
                { name: 'Attributes', href: '/dashboard/attributes', icon: Sliders },
            ]
        },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    useEffect(() => {
        const activeItem = navigation.find(item => {
            if (!item.children) return false;
            const isParentActive = pathname === item.href;
            const isChildActive = item.children.some(child => pathname.startsWith(child.href));
            return isParentActive || isChildActive;
        });

        if (activeItem) {
            setExpandedMenu(activeItem.href);
        } else {
            setExpandedMenu(null);
        }
    }, [pathname]);

    const toggleMenu = (href: string) => {
        setExpandedMenu(prev => prev === href ? null : href);
    };

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
                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedMenu === item.href;
                        
                        const isActive = item.href === '/dashboard' 
                            ? pathname === '/dashboard' 
                            : pathname.startsWith(item.href);

                        return (
                            <div key={item.name} className={styles.navItemContainer}>
                                <div className={styles.navItemWrapper}>
                                    <Link
                                        href={item.href}
                                        className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
                                        onClick={(e) => {
                                            if (hasChildren) {
                                                toggleMenu(item.href);
                                            }
                                        }}
                                    >
                                        <div className={styles.linkContent}>
                                            <Icon size={18} />
                                            <span>{item.name}</span>
                                        </div>
                                        
                                        {hasChildren && (
                                            <span className={styles.chevron}>
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </span>
                                        )}
                                    </Link>
                                </div>

                                {hasChildren && isExpanded && (
                                    <div className={styles.subMenu}>
                                        {item.children!.map((child) => {
                                            const ChildIcon = child.icon;
                                            const isChildActive = pathname.startsWith(child.href);

                                            return (
                                                <Link
                                                    key={child.name}
                                                    href={child.href}
                                                    className={`${styles.navLink} ${styles.subNavLink} ${isChildActive ? styles.activeLink : ''}`}
                                                >
                                                    <ChildIcon size={16} />
                                                    <span>{child.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
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