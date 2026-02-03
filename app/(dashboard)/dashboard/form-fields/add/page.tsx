"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { 
    ArrowLeft, 
    Plus, 
    MessageSquare, 
    Loader2
} from 'lucide-react';

export default function AddFormFieldPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        label: '',
        optionsString: '',
        is_required: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Membersihkan opsi: memisahkan koma, trim spasi, dan hapus input kosong
        const optionsArray = formData.optionsString
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '');

        if (optionsArray.length < 2) {
            notifyError('Please provide at least 2 options.');
            setIsLoading(false);
            return;
        }

        const payload = {
            label: formData.label,
            options: optionsArray,
            is_required: formData.is_required
        };

        try {
            await api.post('/customers/manage/fields', payload);
            notifySuccess('Survey question created');
            router.push('/dashboard/form-fields');
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Failed to create question');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1 className={styles.title}>New Question</h1>
                    <p className={styles.subtitle}>Create a selection-based survey for your customers.</p>
                </div>
                <Link href="/dashboard/form-fields" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back
                </Link>
            </div>

            <form onSubmit={handleSubmit} className={styles.formGrid}>
                <div className={styles.mainContent}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <MessageSquare size={18} /> Configuration
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Question Label *</label>
                            <input 
                                required
                                name="label"
                                className={styles.input}
                                value={formData.label}
                                onChange={handleChange}
                                placeholder="e.g. How did you hear about us?"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Choices / Options *</label>
                            <textarea 
                                required
                                name="optionsString"
                                className={styles.textarea}
                                value={formData.optionsString}
                                onChange={handleChange}
                                placeholder="Social Media, Friends, Advertisement, Other..."
                                rows={5}
                            />
                            <small className={styles.helperText}>Separate each option with a comma.</small>
                        </div>

                        <div className={styles.checkboxGroup}>
                            <input 
                                type="checkbox"
                                id="is_required"
                                name="is_required"
                                checked={formData.is_required}
                                onChange={handleChange}
                                className={styles.checkbox}
                            />
                            <label htmlFor="is_required" className={styles.checkboxLabel}>
                                Mandatory (User must select an answer)
                            </label>
                        </div>
                    </div>
                </div>

                <div className={styles.sideContent}>
                    <div className={styles.card}>
                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            <span>Save Question</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}