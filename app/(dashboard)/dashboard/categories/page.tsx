"use client";

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import styles from './page.module.css';
import { Plus, Trash2, FolderTree, Loader2, Tags } from 'lucide-react';
import toast from 'react-hot-toast';
import { notifyError } from '@/utils/toastHelper';

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    children: Category[];
}

export default function CategoriesPage() {
    const [tree, setTree] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', parent_id: '' });

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setTree(data.data || []);
        } catch (error: any) {
            notifyError("Failed to load categories from server");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                parent_id: formData.parent_id === "" ? null : Number(formData.parent_id)
            };
            await api.post('/categories', payload);
            toast.success("Category created successfully");
            setFormData({ name: '', parent_id: '' });
            fetchCategories();
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to create category";
            notifyError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? This may affect sub-categories.")) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success("Category deleted");
            fetchCategories();
        } catch (error: any) {
            const message = error.response?.data?.message || "Could not delete category";
            notifyError(message);
        }
    };

    const renderRows = (categories: Category[], level = 0) => {
        return categories.map(cat => (
            <React.Fragment key={cat.id}>
                <tr className={styles.tr}>
                    <td className={styles.td} style={{ paddingLeft: `${level * 24 + 16}px` }}>
                        <div className={styles.nameCell}>
                            <FolderTree size={16} className={styles.treeIcon} />
                            <span>{cat.name}</span>
                        </div>
                    </td>
                    <td className={styles.td}>
                        <span className={level === 0 ? styles.rootBadge : styles.subBadge}>
                            {level === 0 ? 'Root' : 'Sub-Category'}
                        </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                        <button onClick={() => handleDelete(cat.id)} className={styles.deleteBtn}>
                            <Trash2 size={16} />
                        </button>
                    </td>
                </tr>
                {cat.children && renderRows(cat.children, level + 1)}
            </React.Fragment>
        ));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Tags size={24} />
                    <h1 className={styles.title}>Categories</h1>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.formSection}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Add New Category</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Name</label>
                                <input 
                                    className={styles.input}
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Perfume"
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Parent Category</label>
                                <select 
                                    className={styles.select}
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                                >
                                    <option value="">None (Set as Root)</option>
                                    {tree.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> Create</>}
                            </button>
                        </form>
                    </div>
                </div>

                <div className={styles.listSection}>
                    <div className={styles.card}>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Name</th>
                                        <th className={styles.th}>Level</th>
                                        <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan={3} className={styles.loadingTd}><Loader2 className="animate-spin" /></td></tr>
                                    ) : tree.length === 0 ? (
                                        <tr><td colSpan={3} className={styles.emptyTd}>No categories found.</td></tr>
                                    ) : renderRows(tree)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}