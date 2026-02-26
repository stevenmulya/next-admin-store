"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import styles from './page.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      notifyError("Please enter a valid email address");
      return false;
    }
    if (formData.password.length < 8) {
      notifyError("Password must be at least 8 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading || !validateForm()) return;

    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/login', formData);
      const token = res?.data?.access_token || res?.access_token;

      if (!token) {
        throw new Error("Authentication failed: No token received");
      }

      const profileRes: any = await api.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const profile = profileRes?.data || profileRes;

      login(token, {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        level: profile.role || profile.level
      });

      notifySuccess('Login successful');
    } catch (error: any) {
      notifyError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} reveal-line`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.subtitle}>Enter your details to access your account.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              placeholder="username@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button 
                type="button" 
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footer}>
          <div className={styles.linkGroup}>
            <span className={styles.footerText}>Unable to access your account?</span>
            <a 
              href="https://wa.me/6287773298907" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}