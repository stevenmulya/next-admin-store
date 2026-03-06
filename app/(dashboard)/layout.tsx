"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { Sun, Moon, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState({ time: '', date: '' });

  const userData = (user as any)?.data || user;
  const userEmail = userData?.email || 'Unknown User';
  const userRole = (userData?.role || 'PERSONNEL').toString().toUpperCase();

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      access: 'All can access' 
    },
    { 
      name: 'Items', 
      href: '/dashboard/items', 
      access: 'All can access' 
    },
    { 
      name: 'Categories', 
      href: '/dashboard/categories', 
      access: 'All can access' 
    },
    ...(userRole === 'OWNER' ? [{
      name: 'Admin',
      href: '/dashboard/users',
      access: 'Only Owner can access'
    }] : []),
  ];

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Asia/Jakarta', hour12: false
      }).format(now);

      const dateStr = new Intl.DateTimeFormat('en-US', {
        day: '2-digit', month: 'short', year: 'numeric',
        timeZone: 'Asia/Jakarta'
      }).format(now);

      setCurrentDateTime({ time: timeStr, date: dateStr.toUpperCase() });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getActivePageName = () => {
    const activeItem = navigation.find(item => pathname === item.href);
    return activeItem ? activeItem.name : 'Portal';
  };

  if (!mounted) return null;
  const currentT = theme === 'system' ? resolvedTheme : theme;

  return (
    <div className={styles.container} data-theme={currentT}>
      <aside className={styles.sidebar} data-collapsed={isCollapsed}>
        <div className={styles.expandedContent}>
          <div className={`${styles.brand} reveal-line`}>
            <span className={styles.brandText}>Admin Panel</span>
            <button onClick={() => setIsCollapsed(true)} className={styles.toggleBtn}>
              <ChevronLeft size={14} />
            </button>
          </div>

          <nav className={styles.nav}>
            {navigation.map((item, idx) => (
              <Link 
                key={item.name}
                href={item.href} 
                className={`${styles.navItemLink} ${pathname === item.href ? styles.active : ''} reveal-line`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <span className={styles.navName}>{item.name}</span>
                <span 
                  className={styles.navAccess}
                  style={{ animationDelay: `${(idx * 0.05) + 0.4}s` }}
                >
                  [{item.access}]
                </span>
              </Link>
            ))}
          </nav>

          <div className={styles.footer}>
            <div className={`${styles.infoBox} reveal-line`} style={{ animationDelay: '0.25s' }}>
              <div className={styles.infoTitle}>
                <Info size={10} />
                <span>Audit Standard Time</span>
              </div>
              <p className={styles.infoDesc}>
                All activities are logged by this time and date, under the name and role of this active session.
              </p>
              
              <div className={styles.metaList}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Operator</span>
                  <span className={styles.metaValue}>{userEmail}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Privilege</span>
                  <span className={styles.metaValue}>{userRole}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Location</span>
                  <span className={styles.metaValue}>Jakarta, ID</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>System Date</span>
                  <span className={styles.metaValue}>{currentDateTime.date}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Clock Time</span>
                  <span className={styles.metaValue}>{currentDateTime.time}</span>
                </div>
              </div>
            </div>

            <div className={`${styles.actionGrid} reveal-line`} style={{ animationDelay: '0.3s' }}>
              <button onClick={() => setTheme(currentT === 'dark' ? 'light' : 'dark')} className={styles.themeToggle}>
                {currentT === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                <span>{currentT === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
              <button onClick={logout} className={styles.logoutBtn}>Sign Out</button>
            </div>
          </div>
        </div>

        <div className={styles.collapsedContent}>
          <button onClick={() => setIsCollapsed(false)} className={styles.toggleBtn}>
            <ChevronRight size={14} />
          </button>
          <div className={styles.verticalLabel}>{getActivePageName()}</div>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}