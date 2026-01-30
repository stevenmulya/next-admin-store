"use client";

import React, { useEffect, useState, useCallback } from 'react';
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
    Pin, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategories';

interface ProductImage {
    id: number;
    url: string;
    is_primary: boolean;
}

interface ProductVariant {
    id: number;
    sku: string;
    price: number;
    stock: number;
    options: any;
}

interface Product {
    id: number;
    name: string;
    slug: string;
    sku: string;
    product_type: 'simple' | 'variable';
    price: number;
    brand: string;
    is_published: boolean;
    is_best_seller: boolean;
    is_pinned: boolean;
    stock: number;
    category_id: number;
    category?: {
        name: string;
        parent?: { name: string };
    };
    images: ProductImage[];
    variants: ProductVariant[];
    creator?: { name: string };
    editor?: { name: string };
    createdAt: string;
    updatedAt: string;
}

interface HistoryLog {
    id: number;
    action: string;
    performed_by: string;
    timestamp: string;
    changes: any;
    product_name: string;
}

export default function ProductsPage() {
    const router = useRouter();
    const { tree } = useCategoryTree();
    
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0);

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [showLowStock, setShowLowStock] = useState(false);
    
    const [selectedParent, setSelectedParent] = useState<string>("all");
    const [selectedSub, setSelectedSub] = useState<string>("all");

    const [historyData, setHistoryData] = useState<HistoryLog[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedProductName, setSelectedProductName] = useState("");
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            let categoryIdParam = "";
            if (selectedSub !== "all") categoryIdParam = selectedSub;
            else if (selectedParent !== "all") categoryIdParam = selectedParent;

            const params = {
                page,
                limit,
                search: debouncedSearch,
                sort: sortOrder,
                category_id: categoryIdParam || undefined,
                low_stock: showLowStock ? 'true' : undefined
            };

            const response = await api.get('/products', { params });
            const { data, meta } = response.data;

            setProducts(Array.isArray(data) ? data : []);
            
            if (meta) {
                setTotalPages(meta.total_pages);
                setTotalData(meta.total_data);
            }
        } catch (error) {
            notifyError('Failed to load inventory');
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, sortOrder, selectedParent, selectedSub, showLowStock]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

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

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Product removed successfully');
            fetchProducts();
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Delete failed');
        }
    };

    const handleParentClick = (id: string) => {
        setSelectedParent(id);
        setSelectedSub("all");
        setPage(1);
    };

    const handleSubClick = (id: string) => {
        setSelectedSub(id);
        setPage(1);
    };

    const handleSortChange = () => {
        setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
        setPage(1);
    };

    const handleLowStockChange = () => {
        setShowLowStock(prev => !prev);
        setPage(1);
    };

    // --- LOGIC PERHITUNGAN STOK ---
    const getTotalStock = (p: Product) => {
        // Jika Variable: Jumlahkan semua stok varian
        if (p.product_type === 'variable' && Array.isArray(p.variants)) {
            return p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        }
        // Jika Simple: Ambil stok produk langsung
        return Number(p.stock) || 0;
    };

    // --- LOGIC PERHITUNGAN HARGA ---
    const getDisplayPrice = (p: Product) => {
        // Jika Variable: Cari harga terendah dari varian
        if (p.product_type === 'variable' && Array.isArray(p.variants) && p.variants.length > 0) {
            const prices = p.variants.map(v => Number(v.price));
            return Math.min(...prices); 
        }
        // Jika Simple: Ambil harga produk langsung
        return Number(p.price) || 0;
    };

    const getImageUrl = (product: Product) => {
        const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
        if (!primaryImage) return null;
        if (primaryImage.url.startsWith('http')) return primaryImage.url;
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${primaryImage.url}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
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
                    <h1 className={styles.title}>Inventory Management</h1>
                    <p className={styles.description}>
                        Showing {products.length} of {totalData} products. Server-side optimized.
                    </p>
                </div>
                <Link href="/dashboard/products/add" className={styles.addButton}>
                    <Plus size={16} /> Add Product
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
                                onClick={() => handleSubClick("all")}
                            >
                                All Sub
                            </button>
                            {tree.find(c => String(c.id) === selectedParent)?.children?.map(child => (
                                <button 
                                    key={child.id}
                                    className={`${styles.subBtn} ${selectedSub === String(child.id) ? styles.activeSub : ""}`}
                                    onClick={() => handleSubClick(String(child.id))}
                                >
                                    {child.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={styles.actionFilters}>
                        <button 
                            className={`${styles.filterBtn} ${showLowStock ? styles.filterBtnActive : ''}`}
                            onClick={handleLowStockChange}
                        >
                            <AlertTriangle size={14} /> Low Stock (&lt; 5)
                        </button>

                        <button className={styles.sortButton} onClick={handleSortChange}>
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
                ) : products.length === 0 ? (
                    <div className={styles.emptyState}>
                        <PackageOpen size={48} strokeWidth={1} />
                        <p>No products found matching your criteria.</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.scrollWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Product Details</th>
                                        <th className={styles.th}>Category</th>
                                        <th className={styles.th}>Price & Stock</th>
                                        <th className={styles.th}>Last Activity</th>
                                        <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => {
                                        const isUpdated = product.updatedAt !== product.createdAt;
                                        
                                        // Panggil fungsi perhitungan di sini
                                        const totalStock = getTotalStock(product);
                                        const displayPrice = getDisplayPrice(product);

                                        return (
                                            <tr key={product.id} className={styles.tr}>
                                                <td className={styles.td}>
                                                    <div className={styles.productCell}>
                                                        <div className={styles.imageWrapper}>
                                                            {getImageUrl(product) ? (
                                                                <img src={getImageUrl(product)!} className={styles.productImg} alt={product.name} />
                                                            ) : (
                                                                <ImageIcon size={18} color="#d4d4d4" />
                                                            )}
                                                        </div>
                                                        <div className={styles.productInfo}>
                                                            <div className={styles.statusRow}>
                                                                {product.is_pinned && <span className={styles.badgePinned}><Pin size={10} fill="currentColor" /> Pinned</span>}
                                                                {product.is_best_seller && <span className={styles.badgeBestSeller}><Star size={10} fill="currentColor" /> Best Seller</span>}
                                                                {!product.is_published && <span className={styles.badgeDraft}>Draft</span>}
                                                                {product.product_type === 'variable' && (
                                                                    <span style={{ fontSize: '9px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                                                                        Variable
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={styles.nameRow}>
                                                                <span className={styles.productName}>{product.name}</span>
                                                            </div>
                                                            <div className={styles.metaRow}>
                                                                <span className={styles.brandName}>{product.brand || 'No Brand'}</span>
                                                                {product.sku && <span className={styles.sku}>{product.sku}</span>}
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
                                                        {/* Tambahkan "from" jika variable product */}
                                                        {product.product_type === 'variable' && <span style={{fontSize: '11px', fontWeight: 400, color: '#666', marginRight: '4px'}}>from</span>}
                                                        
                                                        {/* Format ke USD ($) */}
                                                        ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                                        <button className={styles.actionBtn} title="View History" onClick={() => fetchHistory(product.id, product.name)}>
                                                            <History size={14} />
                                                        </button>
                                                        <button className={styles.actionBtn} title="Edit Product" onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}>
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Delete Product" onClick={() => handleDelete(product.id)}>
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

                        <div className={styles.paginationContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '16px', borderTop: '1px solid #eee' }}>
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))} 
                                disabled={page === 1}
                                className={styles.pageBtn}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #eee', background: page === 1 ? '#f5f5f5' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            
                            <span style={{ fontSize: '14px', color: '#555', fontWeight: 500 }}>
                                Page {page} of {totalPages}
                            </span>

                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                                disabled={page === totalPages || totalPages === 0}
                                className={styles.pageBtn}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #eee', background: (page === totalPages || totalPages === 0) ? '#f5f5f5' : 'white', cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>

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
                                        let changes: any = log.changes;
                                        if (typeof log.changes === 'string') {
                                            try { changes = JSON.parse(log.changes); } catch { changes = {}; }
                                        }

                                        return (
                                            <div key={log.id} className={styles.timelineItem}>
                                                <div className={styles.timelinePoint}></div>
                                                <div className={styles.timelineCard}>
                                                    <div className={styles.timelineHeader}>
                                                        <span className={styles.actionBadge}>{log.action}</span>
                                                        <span className={styles.logTime}>{new Date(log.timestamp).toLocaleString('en-US')}</span>
                                                    </div>
                                                    <p className={styles.logUser}>Performed by: <strong>{log.performed_by}</strong></p>
                                                    
                                                    <div className={styles.changesList}>
                                                        {changes?.updated_fields && Array.isArray(changes.updated_fields) && changes.updated_fields.length > 0 && (
                                                            <div className={styles.tagWrapper} style={{marginBottom: '8px'}}>
                                                                <span className={styles.fieldName} style={{display:'block', width:'100%', marginBottom:'4px'}}>Updated Fields:</span>
                                                                {changes.updated_fields.map((field: string, idx: number) => (
                                                                    <span key={idx} className={styles.fieldTag}>{field}</span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {changes?.note && (
                                                            <p className={styles.logDetails}>"{changes.note}"</p>
                                                        )}
                                                        
                                                        {Object.entries(changes).map(([key, val]) => {
                                                            if (key === 'updated_fields' || key === 'note') return null;
                                                            return (
                                                                <div key={key} style={{ fontSize: '11px', color: '#666', marginTop: '2px', wordBreak: 'break-all' }}>
                                                                    <strong>{key}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
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