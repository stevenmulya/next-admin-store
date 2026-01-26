"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const { data } = await api.post('/users/login', formData);
            login(data.token, {
                id: data._id,
                name: data.name,
                email: data.email,
                isAdmin: data.isAdmin
            });
            toast.success('Authentication Verified');
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Access Denied';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Admin Portal</h1>
                    <p className={styles.subtitle}>
                        Please enter your credentials to access the management dashboard.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input 
                            className={styles.input}
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            placeholder="user@organization.com"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input 
                            className={styles.input}
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}