"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { Sun, Moon, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { 
      name: 'Inventory', 
      href: '/dashboard/items', 
      children: [
        { name: 'Stock List', href: '/dashboard/items' },
        { name: 'Categories', href: '/dashboard/categories' },
      ]
    },
    ...(user?.level?.toString().toUpperCase() === 'OWNER' ? [{
      name: 'Admin',
      href: '/dashboard/users'
    }] : []),
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Asia/Jakarta', hour12: false
      }).format(now) + ' WIB');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getActivePageName = () => {
    const activeItem = navigation.find(item => 
      pathname === item.href || item.children?.some(c => pathname === c.href)
    );
    return activeItem ? activeItem.name : 'Portal';
  };

  if (!mounted) return null;
  const currentT = theme === 'system' ? resolvedTheme : theme;

  return (
    <div className={styles.container} data-theme={currentT}>
      <aside className={styles.sidebar} data-collapsed={isCollapsed}>
        <div className={styles.expandedContent}>
          <div className={styles.brand}>
            <span className={styles.brandText}>Admin Panel</span>
            <button onClick={() => setIsCollapsed(true)} className={styles.toggleBtn}>
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
          </div>

          <nav className={styles.nav}>
            {navigation.map((item, idx) => {
              const hasChildren = !!item.children;
              const isOpen = expandedMenu === item.href;
              const isActive = pathname === item.href || item.children?.some(c => pathname === c.href);

              return (
                <div key={item.name} className="reveal-line" style={{ animationDelay: `${idx * 0.05}s` }}>
                  {hasChildren ? (
                    <>
                      <button 
                        onClick={() => setExpandedMenu(isOpen ? null : item.href)} 
                        className={`${styles.navItemButton} ${isActive && !isOpen ? styles.active : ''}`}
                      >
                        <span>{item.name}</span>
                        {isOpen ? <Minus size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}
                      </button>
                      {isOpen && (
                        <div className={styles.subMenu}>
                          {item.children?.map(child => (
                            <Link 
                              key={child.name} 
                              href={child.href} 
                              className={`${styles.subNavItem} ${pathname === child.href ? styles.subActive : ''}`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} className={`${styles.navItemLink} ${pathname === item.href ? styles.active : ''}`}>
                      {item.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <div className={styles.footer}>
            <div className={styles.userProfile}>
              <div className={styles.userName}>{user?.name || 'User'}</div>
              <div className={styles.userTime}>{currentTime}</div>
            </div>
            <div className={styles.actionButtons}>
              <button onClick={() => setTheme(currentT === 'dark' ? 'light' : 'dark')} className={styles.themeBtn}>
                {currentT === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button onClick={logout} className={styles.logoutBtn}>Sign Out</button>
            </div>
          </div>
        </div>

        <div className={styles.collapsedContent}>
          <button onClick={() => setIsCollapsed(false)} className={styles.toggleBtn}>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
          <div className={styles.verticalLabel}>{getActivePageName()}</div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className="reveal-line">
          {children}
        </div>
      </main>
    </div>
  );
}