"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import toast from 'react-hot-toast';
import { Loader2, Plus, X, ArrowLeft } from 'lucide-react';
import CategorySelector from '@/components/CategorySelector';
import { useCategoryTree } from '@/hooks/useCategories';

interface ProductImage {
    id: number;
    url: string;
    is_primary: boolean;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const productId = resolvedParams.id;
    const { tree, isLoading: categoriesLoading } = useCategoryTree();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<ProductImage[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        brand: '',
        category_id: null as number | null,
        countInStock: '',
        description: ''
    });

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${path}`;
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${productId}`);
                const product = data.data || data;
                
                setFormData({
                    name: product.name || '',
                    price: product.price || '',
                    brand: product.brand || '',
                    category_id: product.category_id ?? null,
                    countInStock: product.countInStock || '',
                    description: product.description || ''
                });

                if (product.images) {
                    setExistingImages(product.images);
                }
            } catch (error) {
                notifyError('Failed to load product');
                router.push('/dashboard/products');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [productId, router]);

    useEffect(() => {
        if (imageFiles.length > 0) {
            const urls = imageFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(urls);
            return () => urls.forEach(url => URL.revokeObjectURL(url));
        } else {
            setPreviewUrls([]);
        }
    }, [imageFiles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            const totalImages = existingImages.length + imageFiles.length;
            if (totalImages >= 5) {
                toast.error("Maximum 5 images allowed");
                return;
            }
            setImageFiles(prev => [...prev, ...selectedFiles].slice(0, 5 - existingImages.length));
        }
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = async (imageId: number) => {
        if (!confirm('Delete this image permanently?')) return;
        try {
            await api.delete(`/products/images/${imageId}`);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            toast.success('Image removed');
        } catch (error) {
            notifyError('Failed to remove image');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.category_id) {
            notifyError("Please select a category");
            return;
        }

        setIsUpdating(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('price', formData.price);
        data.append('brand', formData.brand);
        data.append('category_id', String(formData.category_id));
        data.append('countInStock', formData.countInStock);
        data.append('description', formData.description);

        imageFiles.forEach((file) => {
            data.append('images', file);
        });

        try {
            await api.put(`/products/${productId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Product updated successfully');
            router.push('/dashboard/products');
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Update failed');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <div className={styles.loadingFull}><Loader2 className="animate-spin" size={32} /></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Edit Product</h1>
                    <p className={styles.subtitle}>Update the details and images of your item.</p>
                </div>
                <Link href="/dashboard/products" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back
                </Link>
            </div>

            <div className={styles.formCard}>
                <form onSubmit={handleSubmit} className={styles.formSection}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Product Images (Max 5)</label>
                        <div className={styles.imageGrid}>
                            {existingImages.map((img) => (
                                <div key={img.id} className={styles.imageBox}>
                                    <img src={getImageUrl(img.url)} alt="" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeExistingImage(img.id)} className={styles.removeBtn}>
                                        <X size={12} />
                                    </button>
                                    {img.is_primary && <span className={styles.mainBadge}>Main</span>}
                                </div>
                            ))}
                            {previewUrls.map((url, index) => (
                                <div key={index} className={styles.imageBox} style={{ borderStyle: 'dashed', borderColor: '#000' }}>
                                    <img src={url} alt="Preview" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeNewImage(index)} className={styles.removeBtn}>
                                        <X size={12} />
                                    </button>
                                    {existingImages.length === 0 && index === 0 && <span className={styles.mainBadge}>Main</span>}
                                </div>
                            ))}
                            {existingImages.length + imageFiles.length < 5 && (
                                <label className={styles.uploadPlaceholder}>
                                    <input type="file" multiple onChange={handleFileChange} accept="image/*" hidden />
                                    <Plus size={24} />
                                    <span>Add Photo</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Product Name</label>
                        <input name="name" className={styles.input} value={formData.name} onChange={handleChange} required />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Price ($)</label>
                            <input name="price" type="number" className={styles.input} value={formData.price} onChange={handleChange} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Stock Quantity</label>
                            <input name="countInStock" type="number" className={styles.input} value={formData.countInStock} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            {categoriesLoading ? (
                                <div className={styles.input} style={{ background: '#f9f9f9' }}>Loading...</div>
                            ) : (
                                <CategorySelector 
                                    tree={tree} 
                                    initialId={formData.category_id ?? undefined} 
                                    onSelect={(id) => setFormData(prev => ({ ...prev, category_id: id }))} 
                                />
                            )}
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Brand</label>
                            <input name="brand" className={styles.input} value={formData.brand} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Description</label>
                        <textarea name="description" className={styles.textarea} value={formData.description} onChange={handleChange} required />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isUpdating}>
                        {isUpdating ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}