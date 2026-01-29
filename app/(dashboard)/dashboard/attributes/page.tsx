"use client";

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import styles from './page.module.css';
import { Plus, Trash2, Save, Loader2, Sliders, AlertCircle, ChevronRight, AlertTriangle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { notifyError } from '@/utils/toastHelper';

interface AttributeField {
    id?: number;
    name: string;
    type: 'text' | 'number' | 'color';
}

interface Category {
    id: number;
    name: string;
}

export default function AttributeManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCat, setSelectedCat] = useState<string>("");
    const [fields, setFields] = useState<AttributeField[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState("");
    
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number | null }>({
        isOpen: false,
        index: null
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data.data || []);
            } catch (err) {
                notifyError("Failed to load categories");
            }
        };
        fetchCategories();
    }, []);

    const fetchTemplates = async (catId: string) => {
        setIsLoading(true);
        setSelectedCat(catId);
        try {
            const res = await api.get(`/products/attributes/templates/${catId}`);
            const data = res.data.data;
            setFields(data && data.length > 0 ? data : [{ name: "", type: "text" }]);
        } catch {
            setFields([{ name: "", type: "text" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const addField = () => setFields([...fields, { name: "", type: "text" }]);

    const initiateDelete = (index: number) => {
        if (fields[index].id) {
            setDeleteModal({ isOpen: true, index });
        } else {
            setFields(fields.filter((_, i) => i !== index));
        }
    };

    const confirmDelete = () => {
        if (deleteModal.index !== null) {
            setFields(fields.filter((_, i) => i !== deleteModal.index));
            setDeleteModal({ isOpen: false, index: null });
        }
    };

    const updateField = (index: number, key: keyof AttributeField, value: string) => {
        const newFields = [...fields];
        // @ts-ignore
        newFields[index][key] = value;
        setFields(newFields);
    };

    const handleSave = async () => {
        if (!selectedCat) return toast.error("Please select a category first");
        
        const cleanFields = fields.filter(f => f.name.trim() !== "");
        
        if (cleanFields.length === 0) {
            return toast.error("At least one attribute name is required");
        }

        setIsSaving(true);
        try {
            await api.post('/products/attributes/templates', {
                categoryId: parseInt(selectedCat),
                fields: cleanFields
            });
            toast.success("Configuration saved successfully");
            fetchTemplates(selectedCat);
        } catch (error) {
            notifyError("Failed to sync with database");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Sliders size={24} />
                    <h1 className={styles.title}>Attributes</h1>
                </div>
                <p className={styles.description}>Define custom technical specifications and data fields for specific product categories.</p>
            </div>

            <div className={styles.mainGrid}>
                <aside className={styles.sidebarSection}>
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Select Category</h2>
                        
                        <div className={styles.searchWrapper}>
                            <Search className={styles.searchIcon} size={16} />
                            <input 
                                className={styles.searchInput}
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className={styles.categoryList}>
                            {filteredCategories.length === 0 ? (
                                <p className={styles.emptyText}>No categories found.</p>
                            ) : (
                                filteredCategories.map(cat => (
                                    <button 
                                        key={cat.id} 
                                        className={`${styles.categoryItem} ${selectedCat === String(cat.id) ? styles.activeItem : ""}`}
                                        onClick={() => fetchTemplates(String(cat.id))}
                                    >
                                        <span>{cat.name}</span>
                                        {selectedCat === String(cat.id) && <ChevronRight size={16} />}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                <main className={styles.editorSection}>
                    <div className={styles.card}>
                        <div className={styles.editorHeader}>
                            <h2 className={styles.cardTitle}>
                                {selectedCat 
                                    ? `Configuration for: ${categories.find(c => String(c.id) === selectedCat)?.name}` 
                                    : "Attribute Configuration"
                                }
                            </h2>
                            {selectedCat && (
                                <button onClick={addField} className={styles.addBtn} title="Add Field">
                                    <Plus size={16} /> <span>Add Field</span>
                                </button>
                            )}
                        </div>

                        {!selectedCat ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}><AlertCircle size={40} /></div>
                                <p>Select a category from the left to configure its attributes.</p>
                            </div>
                        ) : isLoading ? (
                            <div className={styles.loadingState}>
                                <Loader2 className="animate-spin" size={32} />
                                <span>Loading attributes...</span>
                            </div>
                        ) : (
                            <div className={styles.formContent}>
                                <div className={styles.infoBox}>
                                    <AlertTriangle size={18} className={styles.infoIcon} />
                                    <p>Changes made here affect all products in this category. Removing an attribute will <strong>permanently delete</strong> its data from existing products upon saving.</p>
                                </div>

                                <div className={styles.fieldsContainer}>
                                    {fields.map((f, i) => (
                                        <div key={i} className={styles.fieldRow}>
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.label}>Attribute Name</label>
                                                <input 
                                                    placeholder="e.g. Material, Size" 
                                                    className={styles.input} 
                                                    value={f.name}
                                                    onChange={(e) => updateField(i, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.label}>Data Type</label>
                                                <select 
                                                    className={styles.select}
                                                    value={f.type}
                                                    onChange={(e) => updateField(i, 'type', e.target.value)}
                                                >
                                                    <option value="text">Text / String</option>
                                                    <option value="number">Number / Integer</option>
                                                    <option value="color">Hex Color</option>
                                                </select>
                                            </div>
                                            <div className={styles.actionGroup}>
                                                <button 
                                                    onClick={() => initiateDelete(i)} 
                                                    className={styles.deleteBtn}
                                                    title="Remove Field"
                                                    type="button"
                                                >
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className={styles.footerActions}>
                                    <button 
                                        disabled={isSaving} 
                                        onClick={handleSave} 
                                        className={styles.submitBtn}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {deleteModal.isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <AlertTriangle size={32} />
                            <h3 className={styles.modalTitle}>Confirm Deletion</h3>
                        </div>
                        <div className={styles.modalBody}>
                            <p>You are about to remove an active attribute.</p>
                            <p><strong>Warning:</strong> This action will permanently delete all data associated with this attribute from all products in this category once you save changes.</p>
                            <p>Are you sure you want to proceed?</p>
                        </div>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.btnCancel} 
                                onClick={() => setDeleteModal({ isOpen: false, index: null })}
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