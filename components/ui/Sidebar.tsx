import Link from 'next/link';
import { LayoutDashboard, Users, ShoppingBag, Settings, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css'; // Import CSS Module

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { name: 'Users', icon: <Users size={20} />, href: '/dashboard/users' },
    { name: 'Products', icon: <ShoppingBag size={20} />, href: '/dashboard/products' },
    { name: 'Settings', icon: <Settings size={20} />, href: '/dashboard/settings' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.title}>NextAdmin.</h1>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <Link key={item.name} href={item.href} className={styles.link}>
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;