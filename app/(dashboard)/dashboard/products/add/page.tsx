"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import toast from 'react-hot-toast';
import { Loader2, Plus, X, ArrowLeft, Info } from 'lucide-react';
import CategorySelector from '@/components/CategorySelector';
import AttributeForm from '@/components/AttributeForm';
import { useCategoryTree } from '@/hooks/useCategories';

export default function AddProductPage() {
    const router = useRouter();
    const { tree, isLoading: categoriesLoading } = useCategoryTree();
    
    const [isLoading, setIsLoading] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    
    // State untuk Atribut Dinamis
    const [attrTemplates, setAttrTemplates] = useState([]);
    const [attrValues, setAttrValues] = useState<Record<number, any>>({});

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        sku: '',
        price: '',
        brand: '',
        category_id: null as number | null,
        countInStock: '',
        description: '',
        similarities: '',
        is_published: true, // Default true agar langsung tayang
        is_pinned: false,
        is_best_seller: false
    });

    // Fetch Template Atribut saat Kategori berubah
    useEffect(() => {
        if (formData.category_id) {
            const fetchAttr = async () => {
                try {
                    const res = await api.get(`/products/attributes/templates/${formData.category_id}`);
                    setAttrTemplates(res.data.data || []);
                    setAttrValues({}); 
                } catch (err) {
                    setAttrTemplates([]);
                }
            };
            fetchAttr();
        }
    }, [formData.category_id]);

    useEffect(() => {
        if (imageFiles.length > 0) {
            const urls = imageFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(urls);
            return () => urls.forEach(url => URL.revokeObjectURL(url));
        } else {
            setPreviewUrls([]);
        }
    }, [imageFiles]);

    // Auto-Generate Slug dari Name
    const generateSlug = (text: string) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Ganti spasi dengan -
            .replace(/[^\w\-]+/g, '')       // Hapus karakter non-word
            .replace(/\-\-+/g, '-')         // Ganti multiple - dengan single -
            .replace(/^-+/, '')             // Trim - dari depan
            .replace(/-+$/, '');            // Trim - dari belakang
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'name') {
            // Jika user ngetik nama, otomatis update slug (kecuali user pernah edit slug manual)
            setFormData((prev) => ({ 
                ...prev, 
                name: value,
                slug: generateSlug(value) 
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleToggle = (name: 'is_published' | 'is_pinned' | 'is_best_seller') => {
        setFormData(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const handleAttributeChange = (id: number, value: any) => {
        setAttrValues(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...selectedFiles].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.category_id) return notifyError("Please select a category");
        if (imageFiles.length === 0) return notifyError("Please upload at least one image");

        setIsLoading(true);
        const data = new FormData();
        
        // Append Basic Fields
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null) {
                data.append(key, String(value));
            }
        });

        // Append Dynamic Attributes
        data.append('attributes', JSON.stringify(attrValues));

        // Append Images
        imageFiles.forEach((file) => {
            data.append('images', file);
        });

        try {
            await api.post('/products', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Product created successfully');
            router.push('/dashboard/products');
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Failed to save product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>New Product</h1>
                    <p className={styles.subtitle}>Fill in the details to add a new item.</p>
                </div>
                <Link href="/dashboard/products" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back
                </Link>
            </div>

            <div className={styles.mainGrid}>
                {/* KOLOM KIRI: FORM UTAMA */}
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>General Information</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Product Name</label>
                            <input name="name" className={styles.input} value={formData.name} onChange={handleChange} required placeholder="Ex: Bakso Sapi Premium" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea name="description" className={styles.textarea} value={formData.description} onChange={handleChange} required placeholder="Describe your product..." />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Media</h3>
                        <div className={styles.imageGrid}>
                            {previewUrls.map((url, index) => (
                                <div key={index} className={styles.imageBox}>
                                    <img src={url} alt="Preview" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeImage(index)} className={styles.removeBtn}>
                                        <X size={12} />
                                    </button>
                                    {index === 0 && <span className={styles.mainBadge}>Main</span>}
                                </div>
                            ))}
                            {previewUrls.length < 5 && (
                                <label className={styles.uploadPlaceholder}>
                                    <input type="file" multiple onChange={handleFileChange} accept="image/*" hidden />
                                    <Plus size={24} />
                                    <span>Add Photo</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Pricing & Inventory</h3>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Price ($)</label>
                                <input name="price" type="number" className={styles.input} value={formData.price} onChange={handleChange} required placeholder="0.00" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Stock</label>
                                <input name="countInStock" type="number" className={styles.input} value={formData.countInStock} onChange={handleChange} required placeholder="0" />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>SKU (Stock Keeping Unit)</label>
                                <input name="sku" className={styles.input} value={formData.sku} onChange={handleChange} placeholder="Ex: BKS-001" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Brand</label>
                                <input name="brand" className={styles.input} value={formData.brand} onChange={handleChange} required placeholder="Ex: Homemade" />
                            </div>
                        </div>
                    </div>

                    {/* DYNAMIC ATTRIBUTES */}
                    {formData.category_id && attrTemplates.length > 0 && (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Specifications</h3>
                            <AttributeForm 
                                templates={attrTemplates}
                                values={attrValues}
                                onChange={handleAttributeChange}
                            />
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN: SIDEBAR SETTINGS */}
                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Status & Visibility</h3>
                        
                        <div className={styles.switchGroup}>
                            <div className={styles.switchLabel}>
                                <span>Publish</span>
                                <small>Make product visible on website</small>
                            </div>
                            <label className={styles.switch}>
                                <input type="checkbox" checked={formData.is_published} onChange={() => handleToggle('is_published')} />
                                <span className={styles.slider}></span>
                            </label>
                        </div>

                        <div className={styles.switchGroup}>
                            <div className={styles.switchLabel}>
                                <span>Pin Product</span>
                                <small>Stick to top of lists</small>
                            </div>
                            <label className={styles.switch}>
                                <input type="checkbox" checked={formData.is_pinned} onChange={() => handleToggle('is_pinned')} />
                                <span className={styles.slider}></span>
                            </label>
                        </div>

                        <div className={styles.switchGroup}>
                            <div className={styles.switchLabel}>
                                <span>Best Seller</span>
                                <small>Show in homepage showcase</small>
                            </div>
                            <label className={styles.switch}>
                                <input type="checkbox" checked={formData.is_best_seller} onChange={() => handleToggle('is_best_seller')} />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Organization</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            {categoriesLoading ? (
                                <div className={styles.loadingText}>Loading...</div>
                            ) : (
                                <CategorySelector 
                                    tree={tree} 
                                    onSelect={(id) => setFormData(prev => ({ ...prev, category_id: id }))} 
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>SEO & Search</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Slug (URL)</label>
                            <input name="slug" className={styles.input} value={formData.slug} onChange={handleChange} placeholder="auto-generated" />
                            <small className={styles.helperText}>domain.com/product/<strong>{formData.slug || '...'}</strong></small>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Search Keywords (Similarities)</label>
                            <textarea 
                                name="similarities" 
                                className={styles.textareaSmall} 
                                value={formData.similarities} 
                                onChange={handleChange} 
                                placeholder="meatballs, bakwan, frozen food..." 
                            />
                            <div className={styles.infoBox}>
                                <Info size={14} />
                                <span>Keywords help users find this product even if they type different terms.</span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading} onClick={handleSubmit}>
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}