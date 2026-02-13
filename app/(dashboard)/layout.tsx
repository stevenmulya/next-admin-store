"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './layout.module.css';

type NavItem = {
    name: string;
    href: string;
    children?: NavItem[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { theme, setTheme, resolvedTheme } = useTheme();
    
    const [mounted, setMounted] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [currentTime, setCurrentTime] = useState<string>('');

    const navigation: NavItem[] = [
        { name: 'Dashboard', href: '/dashboard' },
        { 
            name: 'Orders', 
            href: '/dashboard/orders', 
            children: [
                { name: 'All Orders', href: '/dashboard/orders' },
                { name: 'Pending', href: '/dashboard/orders/pending' },
            ]
        },
        { 
            name: 'Items (New)', 
            href: '/dashboard/items', 
            children: [
                { name: 'Inventory', href: '/dashboard/items' },
                { name: 'Categories', href: '/dashboard/categories' },
                { name: 'Item Types', href: '/dashboard/item-types' },
            ]
        },
        { 
            name: 'Products', 
            href: '/dashboard/products', 
            children: [
                { name: 'Inventory', href: '/dashboard/products' },
                { name: 'Categories', href: '/dashboard/categories' },
                { name: 'Attributes', href: '/dashboard/attributes' },
            ]
        },
        { 
            name: 'Users', 
            href: '/dashboard/users', 
            children: [
                { name: 'Customers', href: '/dashboard/users' },
                { name: 'Admins', href: '/dashboard/admins' },
            ]
        },
        { name: 'Settings', href: '/dashboard/settings' },
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const activeParent = navigation.find(item => 
            item.children && pathname.startsWith(item.href) && item.href !== '/dashboard'
        );
        if (activeParent) {
            setExpandedMenu(activeParent.href);
        }
        setIsMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const timeString = new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Asia/Jakarta',
                hour12: false
            }).format(now);
            setCurrentTime(`${timeString} WIB`);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleToggleMenu = (href: string) => {
        setExpandedMenu(prev => prev === href ? null : href);
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const getActiveParentName = () => {
        if (pathname === '/dashboard') return 'Dashboard';

        for (const item of navigation) {
            if (item.href === pathname) return item.name;
            if (item.children) {
                for (const child of item.children) {
                    if (pathname.startsWith(child.href)) {
                        return item.name;
                    }
                }
            }
            if (pathname.startsWith(item.href) && item.href !== '/dashboard') {
                return item.name;
            }
        }
        return 'Admin Portal';
    };

    const activePageName = getActiveParentName();

    if (!mounted) return null;

    return (
        <div className={styles.container} data-theme={theme === 'system' ? resolvedTheme : theme}>
            <header className={styles.mobileHeader}>
                <span className={styles.mobileBrand}>ADMIN PORTAL</span>
                <button 
                    className={styles.menuToggle}
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                >
                    {isMobileOpen ? 'Close' : 'Menu'}
                </button>
            </header>

            <div 
                className={`${styles.overlay} ${isMobileOpen ? styles.overlayOpen : ''}`} 
                onClick={() => setIsMobileOpen(false)}
            />

            <aside 
                className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}
                data-collapsed={isCollapsed}
            >
                <div className={styles.expandedContent}>
                    <div className={`${styles.brand} ${styles.revealItem}`} style={{ animationDelay: '0ms' }}>
                        <span className={styles.brandText}>Admin Portal</span>
                        <button 
                            className={styles.desktopToggleBtn} 
                            onClick={() => setIsCollapsed(true)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </div>

                    <nav className={styles.nav}>
                        {navigation.map((item, index) => {
                            const hasChildren = item.children && item.children.length > 0;
                            const isOpen = expandedMenu === item.href;
                            const isActive = item.href === '/dashboard' 
                                ? pathname === '/dashboard' 
                                : pathname.startsWith(item.href);
                            const delay = (index + 1) * 50;

                            return (
                                <div 
                                    key={item.name} 
                                    className={styles.revealItem}
                                    style={{ animationDelay: `${delay}ms` }}
                                >
                                    {hasChildren ? (
                                        <button 
                                            onClick={() => handleToggleMenu(item.href)}
                                            className={`${styles.navItemButton} ${isActive ? styles.activeParent : ''}`}
                                        >
                                            <span>{item.name}</span>
                                            <span className={styles.indicator}>
                                                {isOpen ? '−' : '+'}
                                            </span>
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={`${styles.navItemLink} ${isActive ? styles.active : ''}`}
                                        >
                                            <span>{item.name}</span>
                                        </Link>
                                    )}

                                    {hasChildren && (
                                        <div 
                                            className={styles.subMenuWrapper}
                                            style={{ maxHeight: isOpen ? `${item.children!.length * 50}px` : '0px' }}
                                        >
                                            <div className={styles.subMenu}>
                                                {item.children!.map((child) => {
                                                    const isChildActive = pathname === child.href;
                                                    return (
                                                        <Link
                                                            key={child.name}
                                                            href={child.href}
                                                            className={`${styles.subNavItem} ${isChildActive ? styles.subActive : ''}`}
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    <div className={`${styles.footer} ${styles.revealItem}`} style={{ animationDelay: '400ms' }}>
                        <div className={styles.userProfile}>
                            <div className={styles.userName}>{user?.name || 'Administrator'}</div>
                            <div className={styles.userEmail}>{user?.email || 'admin@example.com'}</div>
                            <div className={styles.userTime}>{currentTime}</div>
                        </div>
                        <div className={styles.actionButtons}>
                            <button onClick={toggleTheme} className={styles.themeBtn} type="button">
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button onClick={logout} className={styles.logoutBtn}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.collapsedContent}>
                    <button 
                        className={styles.expandBtn} 
                        onClick={() => setIsCollapsed(false)}
                    >
                        <ChevronRight size={18} />
                    </button>
                    <div className={styles.verticalTextWrapper}>
                        <span className={styles.verticalText}>{activePageName}</span>
                    </div>
                </div>
            </aside>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}