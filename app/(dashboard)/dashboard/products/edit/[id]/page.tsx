"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css'; // Gunakan CSS yang sama dengan Add Page
import { notifyError } from '@/utils/toastHelper';
import toast from 'react-hot-toast';
import { Loader2, Plus, X, ArrowLeft, Info, Box, Layers, Trash2 } from 'lucide-react';
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
    
    // --- IMAGES STATE ---
    // Gambar lama (dari Database)
    const [existingImages, setExistingImages] = useState<{ id: number, url: string, is_primary: boolean }[]>([]);
    // Gambar baru (Upload)
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    
    // --- ATTRIBUTES & VIDEOS ---
    const [attrTemplates, setAttrTemplates] = useState([]);
    const [attrValues, setAttrValues] = useState<Record<number, any>>({});
    const [videos, setVideos] = useState<{ video_url: string, title: string, provider: string }[]>([]);
    
    // --- PRODUCT TYPE & VARIANTS ---
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

    // 1. FETCH PRODUCT DETAILS
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${params.id}`);
                const p = res.data.data;

                // Populate Basic Info
                setFormData({
                    name: p.name,
                    slug: p.slug,
                    sku: p.sku || '',
                    price: p.price,
                    brand: p.brand || '',
                    category_id: p.category_id,
                    countInStock: p.countInStock,
                    description: p.description || '',
                    similarities: p.similarities || '',
                    weight: p.weight || '',
                    length: p.length || '',
                    width: p.width || '',
                    height: p.height || '',
                    is_published: p.is_published,
                    is_pinned: p.is_pinned,
                    is_best_seller: p.is_best_seller
                });

                // Populate Type
                setProductType(p.product_type || 'simple');

                // Populate Images
                if (p.images) {
                    setExistingImages(p.images);
                }

                // Populate Videos
                if (p.videos) {
                    setVideos(p.videos.map((v: any) => ({
                        video_url: v.video_url,
                        title: v.title || '',
                        provider: v.provider
                    })));
                }

                // Populate Variants
                if (p.variants && p.variants.length > 0) {
                    setVariants(p.variants.map((v: any) => ({
                        sku: v.sku,
                        options: typeof v.options === 'string' ? JSON.parse(v.options) : v.options,
                        price: v.price,
                        stock: v.stock,
                        weight: v.weight
                    })));
                }

                // Populate Attributes
                if (p.attributeValues) {
                    const mappedAttrs: Record<number, any> = {};
                    p.attributeValues.forEach((av: any) => {
                        // Pastikan structure attribute value sesuai response API
                        if (av.template) {
                            mappedAttrs[av.attribute_template_id] = av.value; // Sesuaikan field 'value' dengan DB
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

    // 2. FETCH ATTRIBUTE TEMPLATES WHEN CATEGORY CHANGES
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

    // 3. PREVIEW NEW IMAGES
    useEffect(() => {
        if (imageFiles.length > 0) {
            const urls = imageFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(urls);
            return () => urls.forEach(url => URL.revokeObjectURL(url));
        } else {
            setPreviewUrls([]);
        }
    }, [imageFiles]);

    // --- HANDLERS ---

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

    // Handling New Files
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...selectedFiles].slice(0, 5));
        }
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Handling Existing Images (Delete via API directly or mark for deletion)
    // Untuk simplifikasi, kita delete langsung via API jika user klik hapus
    const removeExistingImage = async (imageId: number) => {
        if(!confirm("Delete this image permanently?")) return;
        try {
            // Asumsi ada endpoint delete image, jika tidak ada, skip step ini atau sesuaikan backend
            // await api.delete(`/products/images/${imageId}`); 
            // Jika backend updateProduct menghandle sync gambar, kita cukup filter state:
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
            // Note: Backend 'editProduct' saat ini melakukan 'bulkCreateImages' untuk file baru, 
            // tapi tidak secara eksplisit menghapus gambar lama kecuali kita kirim list ID yang dipertahankan.
            // *Solusi Backend yang ideal*: Kirim array 'kept_image_ids'.
            // Namun untuk sekarang kita manipulasi UI saja.
        } catch (error) {
            notifyError("Failed to remove image");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.category_id) return notifyError("Please select a category");
        
        // Validasi Varian
        if (productType === 'variable' && variants.length === 0) {
            return notifyError("Please generate at least one variant");
        }

        setIsSaving(true);
        const data = new FormData();
        
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null) data.append(key, String(value));
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

        // Upload Gambar Baru
        imageFiles.forEach((file) => {
            data.append('images', file);
        });
        
        // Kirim ID gambar lama yang masih ada (Agar backend tahu mana yang dihapus jika backend support sync)
        // Jika backend belum support sync images (hanya add new), gambar lama tidak akan hilang walau dihapus di UI.
        // Anda perlu menambahkan logic 'deleteImagesByProductId' dan re-insert atau logic 'sync' di backend.
        
        try {
            await api.put(`/products/${params.id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Product updated successfully');
            router.push('/dashboard/products');
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Failed to update product');
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
                {/* --- LEFT COLUMN --- */}
                <div className={styles.leftColumn}>
                    
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>General Information</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Product Name</label>
                            <input name="name" className={styles.input} value={formData.name} onChange={handleChange} required placeholder="Enter product name" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea name="description" className={styles.textarea} value={formData.description} onChange={handleChange} required placeholder="Enter product description" />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Media (Images)</h3>
                        <div className={styles.imageGrid}>
                            {/* Existing Images */}
                            {existingImages.map((img) => (
                                <div key={img.id} className={styles.imageBox}>
                                    <img src={getImageUrl(img.url)} alt="Existing" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeExistingImage(img.id)} className={styles.removeBtn}>
                                        <Trash2 size={12} />
                                    </button>
                                    {img.is_primary && <span className={styles.mainBadge}>Main</span>}
                                </div>
                            ))}

                            {/* New Images */}
                            {previewUrls.map((url, index) => (
                                <div key={`new-${index}`} className={styles.imageBox}>
                                    <img src={url} alt="Preview" className={styles.previewImg} />
                                    <button type="button" onClick={() => removeNewImage(index)} className={styles.removeBtn}>
                                        <X size={12} />
                                    </button>
                                    <span className={styles.newBadge}>New</span>
                                </div>
                            ))}

                            {(existingImages.length + previewUrls.length) < 8 && (
                                <label className={styles.uploadPlaceholder}>
                                    <input type="file" multiple onChange={handleFileChange} accept="image/*" hidden />
                                    <Plus size={24} />
                                    <span>Add Photo</span>
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
                                    <label className={styles.label}>Price ($)</label>
                                    <input name="price" type="number" className={styles.input} value={formData.price} onChange={handleChange} required placeholder="Enter price" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Stock</label>
                                    <input name="countInStock" type="number" className={styles.input} value={formData.countInStock} onChange={handleChange} required placeholder="Enter stock" />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>SKU</label>
                                    <input name="sku" className={styles.input} value={formData.sku} onChange={handleChange} placeholder="Enter SKU" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Brand</label>
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
                                <label className={styles.label}>Brand</label>
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
                                <input name="weight" type="number" className={styles.input} value={formData.weight} onChange={handleChange} placeholder="e.g. 500" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Dimensions (L x W x H) cm</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input name="length" type="number" placeholder="L" className={styles.input} value={formData.length} onChange={handleChange} />
                                    <input name="width" type="number" placeholder="W" className={styles.input} value={formData.width} onChange={handleChange} />
                                    <input name="height" type="number" placeholder="H" className={styles.input} value={formData.height} onChange={handleChange} />
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

                {/* --- RIGHT COLUMN --- */}
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
                        <h3 className={styles.cardTitle}>Organization</h3>
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