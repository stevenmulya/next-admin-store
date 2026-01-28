"use client";

import React, { useState, useEffect, use } from 'react';
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
        is_published: false,
        is_pinned: false,
        is_best_seller: false
    });

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${path}`;
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${productId}`);
                const product = res.data.data || res.data;
                
                if (product) {
                    setFormData({
                        name: product.name || '',
                        slug: product.slug || '',
                        sku: product.sku || '',
                        price: product.price ? String(product.price) : '',
                        brand: product.brand || '',
                        category_id: product.category_id || null,
                        countInStock: product.countInStock !== undefined ? String(product.countInStock) : '',
                        description: product.description || '',
                        similarities: product.similarities || '',
                        is_published: !!product.is_published,
                        is_pinned: !!product.is_pinned,
                        is_best_seller: !!product.is_best_seller
                    });

                    if (product.images) setExistingImages(product.images);

                    if (product.attributeValues && Array.isArray(product.attributeValues)) {
                        const mappedValues: Record<number, any> = {};
                        product.attributeValues.forEach((attr: any) => {
                            mappedValues[attr.attribute_template_id] = attr.value;
                        });
                        setAttrValues(mappedValues);
                    }
                }
            } catch (error) {
                notifyError('Gagal memuat data produk');
                router.push('/dashboard/products');
            } finally {
                setIsLoading(false);
            }
        };
        if (productId) fetchProduct();
    }, [productId, router]);

    useEffect(() => {
        if (formData.category_id) {
            const fetchTemplates = async () => {
                try {
                    const res = await api.get(`/products/attributes/templates/${formData.category_id}`);
                    setAttrTemplates(res.data.data || []);
                } catch (err) {
                    setAttrTemplates([]);
                }
            };
            fetchTemplates();
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

    const generateSlug = (text: string) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'name' && !formData.slug) {
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
            const totalImages = existingImages.length + imageFiles.length;
            if (totalImages >= 5) {
                toast.error("Maksimal 5 gambar diperbolehkan");
                return;
            }
            setImageFiles(prev => [...prev, ...selectedFiles].slice(0, 5 - existingImages.length));
        }
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = async (imageId: number) => {
        if (!confirm('Hapus gambar ini secara permanen?')) return;
        try {
            await api.delete(`/products/images/${imageId}`);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            toast.success('Gambar berhasil dihapus');
        } catch (error) {
            notifyError('Gagal menghapus gambar');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.category_id) return notifyError("Silahkan pilih kategori");

        setIsUpdating(true);
        const data = new FormData();
        
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null) {
                data.append(key, String(value));
            }
        });

        data.append('attributes', JSON.stringify(attrValues));
        imageFiles.forEach((file) => data.append('images', file));

        try {
            await api.put(`/products/${productId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Produk berhasil diperbarui');
            router.push('/dashboard/products');
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Gagal memperbarui produk');
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
                    <p className={styles.subtitle}>Perbarui detail dan gambar item Anda.</p>
                </div>
                <Link href="/dashboard/products" className={styles.backLink}>
                    <ArrowLeft size={16} /> Kembali
                </Link>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>General Information</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Product Name</label>
                            <input name="name" className={styles.input} value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea name="description" className={styles.textarea} value={formData.description} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Media</h3>
                        <div className={styles.imageGrid}>
                            {existingImages.map((img) => (
                                <div key={img.id} className={styles.imageBox}>
                                    <img src={getImageUrl(img.url)} alt="" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeExistingImage(img.id)} className={styles.removeBtn}>
                                        <X size={12} />
                                    </button>
                                    {img.is_primary && <span className={styles.mainBadge}>Utama</span>}
                                </div>
                            ))}
                            {previewUrls.map((url, index) => (
                                <div key={index} className={styles.imageBox} style={{ borderStyle: 'dashed', borderColor: '#000' }}>
                                    <img src={url} alt="Preview" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeNewImage(index)} className={styles.removeBtn}>
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {existingImages.length + imageFiles.length < 5 && (
                                <label className={styles.uploadPlaceholder}>
                                    <input type="file" multiple onChange={handleFileChange} accept="image/*" hidden />
                                    <Plus size={24} />
                                    <span>Tambah Foto</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Pricing & Inventory</h3>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Price ($)</label>
                                <input name="price" type="number" step="0.01" className={styles.input} value={formData.price} onChange={handleChange} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Stock</label>
                                <input name="countInStock" type="number" className={styles.input} value={formData.countInStock} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>SKU</label>
                                <input name="sku" className={styles.input} value={formData.sku} onChange={handleChange} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Brand</label>
                                <input name="brand" className={styles.input} value={formData.brand} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>

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

                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Status & Visibility</h3>
                        
                        <div className={styles.switchGroup}>
                            <div className={styles.switchLabel}>
                                <span>Publish</span>
                                <small>Visible on website</small>
                            </div>
                            <label className={styles.switch}>
                                <input type="checkbox" checked={formData.is_published} onChange={() => handleToggle('is_published')} />
                                <span className={styles.slider}></span>
                            </label>
                        </div>

                        <div className={styles.switchGroup}>
                            <div className={styles.switchLabel}>
                                <span>Pin Product</span>
                                <small>Stick to top</small>
                            </div>
                            <label className={styles.switch}>
                                <input type="checkbox" checked={formData.is_pinned} onChange={() => handleToggle('is_pinned')} />
                                <span className={styles.slider}></span>
                            </label>
                        </div>

                        <div className={styles.switchGroup}>
                            <div className={styles.switchLabel}>
                                <span>Best Seller</span>
                                <small>Homepage showcase</small>
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
                                    initialId={formData.category_id ?? undefined}
                                    onSelect={(id) => setFormData(prev => ({ ...prev, category_id: id }))} 
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>SEO & Search</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Slug (URL)</label>
                            <input name="slug" className={styles.input} value={formData.slug} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Keywords</label>
                            <textarea 
                                name="similarities" 
                                className={styles.textareaSmall} 
                                value={formData.similarities} 
                                onChange={handleChange} 
                                placeholder="meatballs, bakwan..." 
                            />
                            <div className={styles.infoBox}>
                                <Info size={14} />
                                <span>Search aliases</span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isUpdating} onClick={handleSubmit}>
                        {isUpdating ? <Loader2 size={18} className="animate-spin" /> : 'Update Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}