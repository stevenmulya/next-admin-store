"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { notifyError } from '@/utils/toastHelper';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;
        
        setIsLoading(true);
        try {
            const response = await api.post('/users/login', formData);
            const { data } = response.data; 

            login(data.token, {
                id: data.id,
                name: data.name,
                email: data.email,
                level: data.level
            });

            toast.success('Authentication Verified');
        } catch (error: unknown) {
            let errorMsg = 'Access Denied';
            
            if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.message || error.message;
            } else if (error instanceof Error) {
                errorMsg = error.message;
            }
            
            notifyError(errorMsg);
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

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input 
                            className={styles.input}
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            placeholder="name@company.com"
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.passwordWrapper}>
                            <input 
                                className={styles.input}
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                required
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button 
                                type="button"
                                className={styles.eyeBtn}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitBtn} 
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                <span>Authenticating...</span>
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}