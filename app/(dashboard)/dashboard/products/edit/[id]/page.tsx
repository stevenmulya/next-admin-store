"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import toast from 'react-hot-toast';
import { Loader2, Plus, X, ArrowLeft, Box, Layers, Trash2 } from 'lucide-react';
import CategorySelector from '@/components/CategorySelector';
import AttributeForm from '@/components/AttributeForm';
import VideoManager from '@/components/VideoManager';
import VariantManager, { VariantItem } from '@/components/VariantManager';
import { useCategoryTree } from '@/hooks/useCategories';

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const { tree, isLoading: categoriesLoading } = useCategoryTree();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [existingImages, setExistingImages] = useState<{ id: number, url: string, is_primary: boolean }[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    
    const [attrTemplates, setAttrTemplates] = useState([]);
    const [attrValues, setAttrValues] = useState<Record<number, any>>({});
    const [videos, setVideos] = useState<{ video_url: string, title: string, provider: string }[]>([]);
    
    const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
    const [variants, setVariants] = useState<VariantItem[]>([]);

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
        weight: '',
        length: '',
        width: '',
        height: '',
        is_published: true, 
        is_pinned: false,
        is_best_seller: false
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${params.id}`);
                const p = res.data.data;

                // PERBAIKAN DI SINI: Gunakan ( ?? '' ) untuk menangani null/undefined dari API
                // Kita juga mapping p.stock ke countInStock jika p.countInStock undefined
                setFormData({
                    name: p.name ?? '',
                    slug: p.slug ?? '',
                    sku: p.sku ?? '',
                    price: p.price ?? '',
                    brand: p.brand ?? '',
                    category_id: p.category_id ?? null,
                    // Prioritaskan p.stock jika countInStock tidak ada
                    countInStock: p.countInStock ?? p.stock ?? '', 
                    description: p.description ?? '',
                    similarities: p.similarities ?? '',
                    weight: p.weight ?? '',
                    length: p.length ?? '',
                    width: p.width ?? '',
                    height: p.height ?? '',
                    is_published: !!p.is_published, // Paksa jadi boolean
                    is_pinned: !!p.is_pinned,
                    is_best_seller: !!p.is_best_seller
                });

                setProductType(p.product_type || 'simple');

                if (p.images) {
                    setExistingImages(p.images);
                }

                if (p.videos) {
                    setVideos(p.videos.map((v: any) => ({
                        video_url: v.video_url,
                        title: v.title || '',
                        provider: v.provider
                    })));
                }

                if (p.variants && p.variants.length > 0) {
                    setVariants(p.variants.map((v: any) => ({
                        sku: v.sku,
                        options: typeof v.options === 'string' ? JSON.parse(v.options) : v.options,
                        price: v.price,
                        stock: v.stock,
                        weight: v.weight
                    })));
                }

                if (p.attributeValues) {
                    const mappedAttrs: Record<number, any> = {};
                    p.attributeValues.forEach((av: any) => {
                        if (av.template) {
                            mappedAttrs[av.attribute_template_id] = av.value;
                        }
                    });
                    setAttrValues(mappedAttrs);
                }

            } catch (error) {
                notifyError("Failed to fetch product details");
                router.push('/dashboard/products');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) fetchProduct();
    }, [params.id, router]);

    useEffect(() => {
        if (formData.category_id) {
            const fetchAttr = async () => {
                try {
                    const res = await api.get(`/products/attributes/templates/${formData.category_id}`);
                    setAttrTemplates(res.data.data || []);
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
        if (name === 'name') {
            setFormData((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
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
            
            const invalidFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
            if (invalidFiles.length > 0) {
                notifyError("One or more images exceed the 5MB limit");
                return;
            }

            if (existingImages.length + imageFiles.length + selectedFiles.length > 5) {
                notifyError("Total images cannot exceed 5");
                return;
            }

            setImageFiles(prev => [...prev, ...selectedFiles]);
        }
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = async (imageId: number) => {
        if(!confirm("Are you sure you want to delete this image?")) return;
        try {
            await api.delete(`/products/images/${imageId}`); 
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            toast.success("Image removed");
        } catch (error) {
            notifyError("Failed to delete image. It might be linked to orders.");
        }
    };

    const validateForm = () => {
        if (!formData.name.trim() || formData.name.length < 3) return "Product name must be at least 3 characters";
        
        if (!formData.category_id) return "Please select a category";
        
        if (existingImages.length === 0 && imageFiles.length === 0) return "Please have at least one image";
        
        if (!formData.brand.trim()) return "Brand is required";

        if (productType === 'simple') {
            if (!formData.price || Number(formData.price) <= 0) return "Price must be greater than $0";
            if (formData.countInStock === '' || Number(formData.countInStock) < 0) return "Stock cannot be negative";
        }

        if (productType === 'variable') {
            if (variants.length === 0) return "Please generate at least one variant for variable products";
            const invalidVariant = variants.find(v => Number(v.price) <= 0 || Number(v.stock) < 0);
            if (invalidVariant) return `Variant ${invalidVariant.sku} has invalid price or stock`;
        }

        if (Number(formData.weight) < 0) return "Weight cannot be negative";
        if (Number(formData.length) < 0 || Number(formData.width) < 0 || Number(formData.height) < 0) {
            return "Dimensions cannot be negative";
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const error = validateForm();
        if (error) {
            notifyError(error);
            return;
        }

        setIsSaving(true);
        const data = new FormData();
        
        // PENTING: Backend mengharapkan 'stock', tapi state kita 'countInStock'
        // Kita harus mapping saat kirim
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'countInStock') {
                 data.append('stock', String(value));
            } else if (value !== null && value !== '') {
                data.append(key, String(value));
            }
        });
        
        data.append('product_type', productType);
        data.append('attributes', JSON.stringify(attrValues));

        if (videos.length > 0) {
            const validVideos = videos.filter(v => v.video_url.trim() !== '');
            if (validVideos.length > 0) data.append('videos', JSON.stringify(validVideos));
        }

        if (productType === 'variable') {
            data.append('variants', JSON.stringify(variants));
        }

        imageFiles.forEach((file) => {
            data.append('images', file);
        });
        
        try {
            await api.put(`/products/${params.id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Product updated successfully');
            router.push('/dashboard/products');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to update product';
            if (message.includes(',')) {
                message.split(',').forEach((err: string) => notifyError(err.trim()));
            } else {
                notifyError(message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className={styles.loadingContainer}><Loader2 size={32} className="animate-spin" /></div>;
    }

    const getImageUrl = (url: string) => {
        return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${url}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Edit Product</h1>
                    <p className={styles.subtitle}>Update product information and inventory.</p>
                </div>
                <Link href="/dashboard/products" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back
                </Link>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>General Information</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Product Name <span style={{color: 'red'}}>*</span></label>
                            <input name="name" className={styles.input} value={formData.name} onChange={handleChange} required placeholder="Enter product name" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea name="description" className={styles.textarea} value={formData.description} onChange={handleChange} required placeholder="Enter product description" />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Media (Images) <span style={{color: 'red'}}>*</span></h3>
                        <div className={styles.imageGrid}>
                            {existingImages.map((img) => (
                                <div key={img.id} className={styles.imageBox}>
                                    <img src={getImageUrl(img.url)} alt="Existing" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeExistingImage(img.id)} className={styles.removeBtn}>
                                        <Trash2 size={12} />
                                    </button>
                                    {img.is_primary && <span className={styles.mainBadge}>Main</span>}
                                </div>
                            ))}

                            {previewUrls.map((url, index) => (
                                <div key={`new-${index}`} className={styles.imageBox}>
                                    <img src={url} alt="Preview" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeNewImage(index)} className={styles.removeBtn}>
                                        <X size={12} />
                                    </button>
                                    <span className={styles.newBadge}>New</span>
                                </div>
                            ))}

                            {(existingImages.length + previewUrls.length) < 5 && (
                                <label className={styles.uploadPlaceholder}>
                                    <input type="file" multiple onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" hidden />
                                    <Plus size={24} />
                                    <span>Add Photo</span>
                                    <span style={{fontSize: '10px', marginTop: '4px'}}>(Max 5MB)</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Product Videos</h3>
                        <VideoManager videos={videos} onChange={setVideos} />
                    </div>

                    {productType === 'simple' ? (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Pricing & Inventory</h3>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Price ($) <span style={{color: 'red'}}>*</span></label>
                                    <input 
                                        name="price" 
                                        type="number" 
                                        step="0.01"
                                        className={styles.input} 
                                        value={formData.price} 
                                        onChange={handleChange} 
                                        onWheel={(e) => e.currentTarget.blur()}
                                        required 
                                        placeholder="e.g. 29.99" 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Stock <span style={{color: 'red'}}>*</span></label>
                                    {/* VALUE DIJAMIN TIDAK UNDEFINED KARENA SUDAH DITANGANI DI USEEFFECT */}
                                    <input 
                                        name="countInStock" 
                                        type="number" 
                                        className={styles.input} 
                                        value={formData.countInStock} 
                                        onChange={handleChange}
                                        onWheel={(e) => e.currentTarget.blur()} 
                                        required 
                                        placeholder="Enter stock" 
                                    />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>SKU</label>
                                    <input name="sku" className={styles.input} value={formData.sku} onChange={handleChange} placeholder="Enter SKU" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Brand <span style={{color: 'red'}}>*</span></label>
                                    <input name="brand" className={styles.input} value={formData.brand} onChange={handleChange} required placeholder="Enter brand" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>
                                <Layers size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/>
                                Variants Generator
                            </h3>
                            <p className={styles.helperText} style={{ marginBottom: '16px' }}>
                                Manage variants. Editing variants will replace the existing configuration.
                            </p>
                            <VariantManager variants={variants} onChange={setVariants} />
                            
                            <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                                <label className={styles.label}>Brand <span style={{color: 'red'}}>*</span></label>
                                <input name="brand" className={styles.input} value={formData.brand} onChange={handleChange} required placeholder="Enter brand" />
                            </div>
                        </div>
                    )}

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <Box size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }}/>
                            Shipping & Delivery
                        </h3>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Weight (Gram)</label>
                                <input name="weight" type="number" onWheel={(e) => e.currentTarget.blur()} className={styles.input} value={formData.weight} onChange={handleChange} placeholder="e.g. 500" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Dimensions (L x W x H) cm</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input name="length" type="number" onWheel={(e) => e.currentTarget.blur()} placeholder="L" className={styles.input} value={formData.length} onChange={handleChange} />
                                    <input name="width" type="number" onWheel={(e) => e.currentTarget.blur()} placeholder="W" className={styles.input} value={formData.width} onChange={handleChange} />
                                    <input name="height" type="number" onWheel={(e) => e.currentTarget.blur()} placeholder="H" className={styles.input} value={formData.height} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {formData.category_id && attrTemplates.length > 0 && (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>Specifications</h3>
                            <AttributeForm templates={attrTemplates} values={attrValues} onChange={handleAttributeChange} />
                        </div>
                    )}
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Status & Visibility</h3>

                        <div className={styles.formGroup} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f5f5f5' }}>
                            <label className={styles.label} style={{ marginBottom: '12px' }}>Product Type</label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '10px' }}>
                                <input 
                                    type="radio" 
                                    name="ptype" 
                                    checked={productType === 'simple'} 
                                    onChange={() => setProductType('simple')}
                                    style={{ accentColor: '#171717', width: '16px', height: '16px' }}
                                />
                                <div>
                                    <span style={{ fontSize: '14px', fontWeight: 500, display: 'block' }}>Simple Product</span>
                                    <span style={{ fontSize: '11px', color: '#666' }}>Standard item with one SKU</span>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input 
                                    type="radio" 
                                    name="ptype" 
                                    checked={productType === 'variable'} 
                                    onChange={() => setProductType('variable')}
                                    style={{ accentColor: '#171717', width: '16px', height: '16px' }}
                                />
                                <div>
                                    <span style={{ fontSize: '14px', fontWeight: 500, display: 'block' }}>Product with Variants</span>
                                    <span style={{ fontSize: '11px', color: '#666' }}>Has colors, sizes, etc.</span>
                                </div>
                            </label>
                        </div>
                        
                        <div className={styles.switchGroup}>
                            <div className={styles.switchLabel}>
                                <span>Publish</span>
                                <small>Make product visible</small>
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
                        <h3 className={styles.cardTitle}>Organization <span style={{color: 'red'}}>*</span></h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            {categoriesLoading ? (
                                <div className={styles.loadingText}>Loading...</div>
                            ) : (
                                <CategorySelector tree={tree} selectedId={formData.category_id} onSelect={(id) => setFormData(prev => ({ ...prev, category_id: id }))} />
                            )}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>SEO & Search</h3>
                         <div className={styles.formGroup}>
                            <label className={styles.label}>Slug (URL)</label>
                            <input name="slug" className={styles.input} value={formData.slug} onChange={handleChange} placeholder="Auto-generated slug" />
                        </div>
                         <div className={styles.formGroup}>
                            <label className={styles.label}>Search Keywords</label>
                            <textarea name="similarities" className={styles.textareaSmall} value={formData.similarities} onChange={handleChange} placeholder="Enter keywords" />
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isSaving} onClick={handleSubmit}>
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Update Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}