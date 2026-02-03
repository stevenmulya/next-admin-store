"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing verification token.');
            return;
        }

        const verifyToken = async () => {
            try {
                await api.get(`/customers/verify-email?token=${token}`);
                setStatus('success');
                setMessage('Your email has been successfully verified. You can now login to your account.');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
            }
        };

        const timer = setTimeout(() => {
            verifyToken();
        }, 1000);

        return () => clearTimeout(timer);
    }, [token]);

    return (
        <div className={styles.card}>
            {status === 'loading' && (
                <div className={styles.statusBox}>
                    <div className={styles.iconWrapper}>
                        <Loader2 size={48} className={styles.spinner} color="#666" />
                    </div>
                    <h1 className={styles.title}>Verifying...</h1>
                    <p className={styles.description}>{message}</p>
                </div>
            )}

            {status === 'success' && (
                <div className={styles.statusBox}>
                    <div className={styles.iconWrapper} style={{ background: '#ecfdf5' }}>
                        <CheckCircle size={48} color="#10b981" />
                    </div>
                    <h1 className={styles.title}>Verified!</h1>
                    <p className={styles.description}>{message}</p>
                    
                    <div className={styles.actions}>
                        <Link href="/auth/login" className={styles.primaryBtn}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className={styles.statusBox}>
                    <div className={styles.iconWrapper} style={{ background: '#fef2f2' }}>
                        <XCircle size={48} color="#ef4444" />
                    </div>
                    <h1 className={styles.title}>Verification Failed</h1>
                    <p className={styles.description}>{message}</p>
                    
                    <div className={styles.actions}>
                        <Link href="/" className={styles.secondaryBtn}>
                            <ArrowLeft size={16} /> Back to Home
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className={styles.container}>
            <Suspense fallback={<div className={styles.loadingFallback}>Loading...</div>}>
                <VerifyContent />
            </Suspense>
        </div>
    );
}