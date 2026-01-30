"use client";

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import styles from './page.module.css';
import { Plus, Trash2, FolderTree, Loader2, Tags, Search, AlertTriangle } from 'lucide-react';
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
    const [searchQuery, setSearchQuery] = useState('');
    
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null }>({
        isOpen: false,
        id: null
    });

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

    const filterTree = (nodes: Category[], query: string): Category[] => {
        if (!query) return nodes;

        return nodes
            .map(node => {
                const isMatch = node.name.toLowerCase().includes(query.toLowerCase());

                if (isMatch) {
                    return node;
                }

                const filteredChildren = filterTree(node.children || [], query);

                if (filteredChildren.length > 0) {
                    return { ...node, children: filteredChildren };
                }

                return null;
            })
            .filter(Boolean) as Category[];
    };

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

    const initiateDelete = (id: number) => {
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (deleteModal.id === null) return;

        try {
            await api.delete(`/categories/${deleteModal.id}`);
            toast.success("Category deleted");
            fetchCategories();
        } catch (error: any) {
            const message = error.response?.data?.message || "Could not delete category";
            notifyError(message);
        } finally {
            setDeleteModal({ isOpen: false, id: null });
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
                        <button onClick={() => initiateDelete(cat.id)} className={styles.deleteBtn}>
                            <Trash2 size={16} />
                        </button>
                    </td>
                </tr>
                {cat.children && renderRows(cat.children, level + 1)}
            </React.Fragment>
        ));
    };

    const displayedTree = filterTree(tree, searchQuery);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Tags size={24} />
                    <h1 className={styles.title}>Categories</h1>
                </div>
                <p className={styles.description}>Manage product hierarchy and organize items into logical groups for better navigation.</p>
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
                                    placeholder="Enter category name"
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
                        <div className={styles.tableHeader}>
                            <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Category List</h2>
                            <div className={styles.searchWrapper}>
                                <Search size={16} className={styles.searchIcon} />
                                <input 
                                    type="text" 
                                    placeholder="Search categories..." 
                                    className={styles.searchInput}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

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
                                    ) : displayedTree.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className={styles.emptyTd}>
                                                {searchQuery ? 'No matching categories found.' : 'No categories found.'}
                                            </td>
                                        </tr>
                                    ) : renderRows(displayedTree)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {deleteModal.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <AlertTriangle size={32} />
                            <h3 className={styles.modalTitle}>Confirm Deletion</h3>
                        </div>
                        <div className={styles.modalBody}>
                            <p>You are about to delete a category.</p>
                            <p><strong>Warning:</strong> If this category has sub-categories, they will also be deleted or detached. Products linked to this category will become uncategorized.</p>
                            <p>Are you sure you want to proceed?</p>
                        </div>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.btnCancel} 
                                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.btnConfirm} 
                                onClick={confirmDelete}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}