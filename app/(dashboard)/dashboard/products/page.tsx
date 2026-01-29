"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import toast from 'react-hot-toast';
import { 
    Plus, Pencil, Trash2, Loader2, PackageOpen, 
    ImageIcon, Search, ArrowUpDown, AlertTriangle,
    History, User, X, Clock,
    Pin, Star
} from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategories';

interface Product {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: number;
    brand: string;
    is_published: boolean;
    is_best_seller: boolean;
    is_pinned: boolean;
    similarities?: string;
    category_id: number;
    category?: {
        name: string;
        parent?: { name: string };
    };
    images?: { url: string; is_primary: boolean }[];
    countInStock: number;
    variants?: { price: number; stock: number }[];
    creator?: { name: string };
    editor?: { name: string };
    createdAt: string;
    updatedAt: string;
}

export default function ProductsPage() {
    const router = useRouter();
    const { tree } = useCategoryTree();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [showLowStock, setShowLowStock] = useState(false);
    
    const [selectedParent, setSelectedParent] = useState<string>("all");
    const [selectedSub, setSelectedSub] = useState<string>("all");

    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedProductName, setSelectedProductName] = useState("");
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            const data = response.data.data || response.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            notifyError('Failed to load inventory');
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHistory = async (id: number, name: string) => {
        setIsHistoryLoading(true);
        setSelectedProductName(name);
        setIsHistoryOpen(true);
        try {
            const response = await api.get(`/products/${id}/history`);
            setHistoryData(response.data.data || []);
        } catch (error) {
            setHistoryData([]);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Helper: Hitung total stok dari semua variant
    const getTotalStock = (p: Product) => {
        if (p.variants && p.variants.length > 0) {
            return p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        }
        return Number(p.countInStock) || 0;
    };

    // Helper: Ambil harga terendah untuk display
    const getDisplayPrice = (p: Product) => {
        if (p.variants && p.variants.length > 0) {
            const prices = p.variants.map(v => Number(v.price));
            return Math.min(...prices);
        }
        return Number(p.price);
    };

    const filteredAndSortedProducts = useMemo(() => {
        let result = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
            
            let matchesCategory = true;
            if (selectedParent !== "all") {
                if (selectedSub !== "all") {
                    matchesCategory = String(p.category_id) === selectedSub;
                } else {
                    const currentParent = tree.find(c => String(c.id) === selectedParent);
                    const childrenIds = currentParent?.children?.map(child => String(child.id)) || [];
                    matchesCategory = String(p.category_id) === selectedParent || childrenIds.includes(String(p.category_id));
                }
            }

            const currentStock = getTotalStock(p);
            const matchesStock = showLowStock ? currentStock < 5 : true;
            
            return matchesSearch && matchesCategory && matchesStock;
        });

        return result.sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) {
                return a.is_pinned ? -1 : 1;
            }
            
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [products, searchQuery, sortOrder, showLowStock, selectedParent, selectedSub, tree]);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Product removed');
            setProducts(products.filter(p => p.id !== id));
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Delete failed');
        }
    };

    const handleParentClick = (id: string) => {
        setSelectedParent(id);
        setSelectedSub("all");
    };

    const getImageUrl = (product: Product) => {
        const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
        if (!primaryImage) return null;
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${primaryImage.url}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Inventory</h1>
                    <p className={styles.description}>Manage your entire product catalog, track stock levels, and view modification history.</p>
                </div>
                <Link href="/dashboard/products/add" className={styles.addButton}>
                    <Plus size={16} /> Add New
                </Link>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search name, brand, or SKU..." 
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className={styles.filterContainer}>
                    <div className={styles.categoryButtonGroup}>
                        <button 
                            className={`${styles.catBtn} ${selectedParent === "all" ? styles.activeCat : ""}`}
                            onClick={() => handleParentClick("all")}
                        >
                            All Categories
                        </button>
                        {tree.map(cat => (
                            <button 
                                key={cat.id}
                                className={`${styles.catBtn} ${selectedParent === String(cat.id) ? styles.activeCat : ""}`}
                                onClick={() => handleParentClick(String(cat.id))}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {selectedParent !== "all" && tree.find(c => String(c.id) === selectedParent)?.children && tree.find(c => String(c.id) === selectedParent)!.children!.length > 0 && (
                        <div className={styles.subCategoryGroup}>
                            <button 
                                className={`${styles.subBtn} ${selectedSub === "all" ? styles.activeSub : ""}`}
                                onClick={() => setSelectedSub("all")}
                            >
                                All {tree.find(c => String(c.id) === selectedParent)?.name}
                            </button>
                            {tree.find(c => String(c.id) === selectedParent)?.children?.map(child => (
                                <button 
                                    key={child.id}
                                    className={`${styles.subBtn} ${selectedSub === String(child.id) ? styles.activeSub : ""}`}
                                    onClick={() => setSelectedSub(String(child.id))}
                                >
                                    {child.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={styles.actionFilters}>
                        <button 
                            className={`${styles.filterBtn} ${showLowStock ? styles.filterBtnActive : ''}`}
                            onClick={() => setShowLowStock(!showLowStock)}
                        >
                            <AlertTriangle size={14} /> Low Stock
                        </button>

                        <button className={styles.sortButton} onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}>
                            <ArrowUpDown size={14} />
                            <span className={styles.sortLabel}>Sort:</span>
                            <span className={styles.sortValue}>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                {isLoading ? (
                    <div className={styles.loadingBox}><Loader2 size={24} className="animate-spin" /></div>
                ) : filteredAndSortedProducts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <PackageOpen size={48} strokeWidth={1} />
                        <p>No matches found.</p>
                    </div>
                ) : (
                    <div className={styles.scrollWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th}>Product</th>
                                    <th className={styles.th}>Classification</th>
                                    <th className={styles.th}>Valuation & Stock</th>
                                    <th className={styles.th}>Last Activity</th>
                                    <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedProducts.map((product) => {
                                    const isUpdated = product.updatedAt !== product.createdAt;
                                    const totalStock = getTotalStock(product);
                                    const displayPrice = getDisplayPrice(product);

                                    return (
                                        <tr key={product.id} className={styles.tr}>
                                            <td className={styles.td}>
                                                <div className={styles.productCell}>
                                                    <div className={styles.imageWrapper}>
                                                        {product.images && product.images.length > 0 ? (
                                                            <img src={getImageUrl(product) || ''} className={styles.productImg} alt="" />
                                                        ) : (
                                                            <ImageIcon size={18} color="#d4d4d4" />
                                                        )}
                                                    </div>
                                                    <div className={styles.productInfo}>
                                                        <div className={styles.statusRow}>
                                                            {product.is_pinned && (
                                                                <span className={styles.badgePinned}>
                                                                    <Pin size={10} fill="currentColor" /> Pinned
                                                                </span>
                                                            )}
                                                            {product.is_best_seller && (
                                                                <span className={styles.badgeBestSeller}>
                                                                    <Star size={10} fill="currentColor" /> Best Seller
                                                                </span>
                                                            )}
                                                            {!product.is_published && (
                                                                <span className={styles.badgeDraft}>Draft</span>
                                                            )}
                                                        </div>
                                                        <div className={styles.nameRow}>
                                                            <span className={styles.productName}>{product.name}</span>
                                                        </div>
                                                        <div className={styles.metaRow}>
                                                            <span className={styles.brandName}>{product.brand}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.categoryPath}>
                                                    {product.category?.parent && <span className={styles.parentText}>{product.category.parent.name}</span>}
                                                    <span className={styles.categoryLabel}>{product.category?.name || 'Uncategorized'}</span>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.priceText}>
                                                    {product.variants && product.variants.length > 0 && <span style={{fontSize: '11px', fontWeight: 400, color: '#666', marginRight: '4px'}}>from</span>}
                                                    ${displayPrice.toLocaleString()}
                                                </div>
                                                <div className={totalStock < 5 ? styles.lowStockAlert : styles.inStock}>
                                                    {totalStock} Units
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.activityBox}>
                                                    <div className={styles.activityStatus}>
                                                        <History size={12} />
                                                        <span>{isUpdated ? 'Modified' : 'Created'}</span>
                                                    </div>
                                                    <div className={styles.activityDate}>{formatDate(isUpdated ? product.updatedAt : product.createdAt)}</div>
                                                    <div className={styles.activityUser}>
                                                        <User size={10} />
                                                        <span>{isUpdated ? product.editor?.name : product.creator?.name || 'System'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.actions}>
                                                    <button className={styles.actionBtn} onClick={() => fetchHistory(product.id, product.name)}>
                                                        <History size={14} />
                                                    </button>
                                                    <button className={styles.actionBtn} onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}>
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(product.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* HISTORY DRAWER: Enhanced to show robust details */}
            {isHistoryOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.historyDrawer}>
                        <div className={styles.drawerHeader}>
                            <div>
                                <h2 className={styles.drawerTitle}>Product History</h2>
                                <p className={styles.drawerSubtitle}>{selectedProductName}</p>
                            </div>
                            <button onClick={() => setIsHistoryOpen(false)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.drawerContent}>
                            {isHistoryLoading ? (
                                <div className={styles.centerLoading}><Loader2 className="animate-spin" /></div>
                            ) : historyData.length === 0 ? (
                                <div className={styles.emptyHistory}>
                                    <Clock size={32} strokeWidth={1} />
                                    <p>No activity logs found for this product.</p>
                                </div>
                            ) : (
                                <div className={styles.timeline}>
                                    {historyData.map((log) => {
                                        let changes: any = {};
                                        try {
                                            changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
                                        } catch { changes = {}; }

                                        return (
                                            <div key={log.id} className={styles.timelineItem}>
                                                <div className={styles.timelinePoint}></div>
                                                <div className={styles.timelineCard}>
                                                    <div className={styles.timelineHeader}>
                                                        <span className={styles.actionBadge}>{log.action}</span>
                                                        <span className={styles.logTime}>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                                                    </div>
                                                    <p className={styles.logUser}>Performed by: <strong>{log.performed_by || 'System'}</strong></p>
                                                    
                                                    {/* --- FIX: More robust changes rendering --- */}
                                                    <div className={styles.changesList}>
                                                        {/* 1. Prioritize simple updated_fields list */}
                                                        {changes?.updated_fields && Array.isArray(changes.updated_fields) && (
                                                            <div className={styles.tagWrapper} style={{marginBottom: '8px'}}>
                                                                {changes.updated_fields.map((field: string, idx: number) => (
                                                                    <span key={idx} className={styles.fieldTag}>{field}</span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* 2. Render other detailed keys if they exist (handling data mess) */}
                                                        {Object.entries(changes).map(([key, val]) => {
                                                            if (key === 'updated_fields' || key === 'note') return null;
                                                            return (
                                                                <div key={key} style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
                                                                    <strong>{key}:</strong> {JSON.stringify(val)}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {changes?.note && (
                                                        <p className={styles.logDetails}>{changes.note}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}