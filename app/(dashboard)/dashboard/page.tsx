"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import Card from '@/components/ui/Card';
import { ShoppingBag, Users, DollarSign } from 'lucide-react';

export default function DashboardHome() {
    const { user } = useAuth();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Overview</h1>
                <p className={styles.subtitle}>Welcome back, {user?.name || 'Administrator'}.</p>
            </div>

            <div className={styles.grid}>
                <Card 
                    title="Total Products" 
                    value="12" 
                    icon={<ShoppingBag size={20} />} 
                />
                
                <Card 
                    title="Total Users" 
                    value="5" 
                    icon={<Users size={20} />} 
                />

                <Card 
                    title="Total Revenue" 
                    value="$1,200" 
                    icon={<DollarSign size={20} />} 
                />
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.actions}>
                    <button className={styles.btnPrimary}>
                        Add Product
                    </button>
                    <button className={styles.btnSecondary}>
                        View Orders
                    </button>
                </div>
            </div>
        </div>
    );
}