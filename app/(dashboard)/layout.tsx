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
    ChevronRight,
    MessageSquarePlus,
    List
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
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { 
            name: 'Products', 
            href: '/dashboard/products', 
            icon: Package,
            children: [
                { name: 'Product List', href: '/dashboard/products', icon: List },
                { name: 'Categories', href: '/dashboard/categories', icon: Tags },
                { name: 'Attributes', href: '/dashboard/attributes', icon: Sliders },
            ]
        },
        { 
            name: 'Users', 
            href: '/dashboard/users', 
            icon: Users,
            children: [
                { name: 'Customer List', href: '/dashboard/users', icon: List },
                { name: 'Form Fields', href: '/dashboard/form-fields', icon: MessageSquarePlus },
            ]
        },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    useEffect(() => {
        const activeParent = navigation.find(item => 
            item.children && pathname.startsWith(item.href)
        );
        if (activeParent) {
            setExpandedMenu(activeParent.href);
        }
    }, [pathname]);

    const handleToggleMenu = (item: NavItem, e: React.MouseEvent) => {
        if (item.children) {
            e.preventDefault();
            setExpandedMenu(prev => prev === item.href ? null : item.href);
        }
    };

    return (
        <div className={styles.appContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarBrand}>
                    <Command size={20} className={styles.brandIcon} />
                    <span className={styles.brandText}>Admin Portal</span>
                </div>

                <nav className={styles.sidebarNav}>
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const hasChildren = item.children && item.children.length > 0;
                        const isOpen = expandedMenu === item.href;
                        const isActive = item.href === '/dashboard' 
                            ? pathname === '/dashboard' 
                            : pathname.startsWith(item.href);

                        return (
                            <div key={item.name} className={styles.navGroup}>
                                <Link
                                    href={item.href}
                                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                    onClick={(e) => handleToggleMenu(item, e)}
                                >
                                    <div className={styles.navItemContent}>
                                        <Icon size={18} />
                                        <span>{item.name}</span>
                                    </div>
                                    {hasChildren && (
                                        <div className={styles.navItemChevron}>
                                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                    )}
                                </Link>

                                {hasChildren && isOpen && (
                                    <div className={styles.subMenu}>
                                        {item.children!.map((child) => {
                                            const ChildIcon = child.icon;
                                            const isExactChildActive = pathname === child.href;
                                            
                                            return (
                                                <Link
                                                    key={child.name}
                                                    href={child.href}
                                                    className={`${styles.subNavItem} ${isExactChildActive ? styles.subNavItemActive : ''}`}
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
                    <div className={styles.profileSection}>
                        <div className={styles.profileInfo}>
                            <p className={styles.profileName}>{user?.name || 'Administrator'}</p>
                            <p className={styles.profileEmail}>{user?.email}</p>
                        </div>
                    </div>
                    
                    <button onClick={logout} className={styles.signOutBtn}>
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