"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function AddProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        image: '',
        brand: '',
        category: '',
        countInStock: '',
        description: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/products', formData);
            toast.success('Product created successfully');
            router.push('/dashboard/products');
        } catch (error) {
            toast.error('Failed to create product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Add New Product</h1>
                <Link href="/dashboard/products" className={styles.backLink}>&larr; Back to List</Link>
            </div>

            <div className={styles.formCard}>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Product Name</label>
                        <input name="name" className={styles.input} onChange={handleChange} required placeholder="e.g. Wireless Mouse" />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Price</label>
                        <input name="price" type="number" className={styles.input} onChange={handleChange} required placeholder="0.00" />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Image URL</label>
                        <input name="image" className={styles.input} onChange={handleChange} required placeholder="https://..." />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Brand</label>
                        <input name="brand" className={styles.input} onChange={handleChange} required placeholder="e.g. Logitech" />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Category</label>
                        <input name="category" className={styles.input} onChange={handleChange} required placeholder="e.g. Electronics" />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Count In Stock</label>
                        <input name="countInStock" type="number" className={styles.input} onChange={handleChange} required placeholder="0" />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Description</label>
                        <textarea name="description" className={styles.textarea} onChange={handleChange} required placeholder="Product details..." />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create Product'}
                    </button>
                </form>
            </div>
        </div>
    );
}