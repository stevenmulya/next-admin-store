"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import toast from 'react-hot-toast';
import { 
    Plus, Pencil, Trash2, Loader2, PackageOpen, 
    ImageIcon, Search, ArrowUpDown, ChevronDown,
    History, User, Pin, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategories';

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
    images: { id: number; url: string; is_primary: boolean }[];
    variants: { id: number; sku: string; price: number; stock: number; options: any }[];
    creator?: { name: string };
    editor?: { name: string };
    createdAt: string;
    updatedAt: string;
}

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export default function ProductsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { tree } = useCategoryTree();
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const page = Number(searchParams.get('page')) || 1;
    const sortOrder = (searchParams.get('sort') as SortOption) || 'newest';
    const categoryId = searchParams.get('category_id') || 'all';
    const urlSearch = searchParams.get('search') || '';

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [limit] = useState(10);
    const [localSearch, setLocalSearch] = useState(urlSearch);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [pageInput, setPageInput] = useState(String(page));

    useEffect(() => {
        setLocalSearch(urlSearch);
    }, [urlSearch]);

    useEffect(() => {
        setPageInput(String(page));
    }, [page]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== urlSearch) {
                const params = new URLSearchParams(searchParams.toString());
                if (localSearch) params.set('search', localSearch);
                else params.delete('search');
                params.set('page', '1');
                router.replace(`${pathname}?${params.toString()}`);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localSearch, urlSearch, pathname, router, searchParams]);

    const fetchProducts = async (signal?: AbortSignal) => {
        setIsLoading(true);
        try {
            const params = {
                page,
                limit,
                search: urlSearch,
                sort: sortOrder,
                category_id: categoryId !== 'all' ? categoryId : undefined
            };
            const response = await api.get('/products', { params, signal });
            const { data, meta } = response.data;
            setProducts(Array.isArray(data) ? data : []);
            if (meta) {
                setTotalPages(meta.total_pages);
                setTotalData(meta.total_data);
            }
        } catch (error: any) {
            if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                notifyError('Failed to load inventory');
                setProducts([]);
            }
        } finally {
            if (!signal?.aborted) setIsLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchProducts(controller.signal);
        return () => controller.abort();
    }, [page, limit, urlSearch, sortOrder, categoryId]);

    const updateParam = (key: string, value: string | number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') params.set(key, String(value));
        else params.delete(key);
        if (key !== 'page') params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        setIsSortOpen(false);
    };

    const getSortText = (sort: SortOption) => {
        switch (sort) {
            case 'newest': return 'Newest';
            case 'oldest': return 'Oldest';
            case 'price_asc': return 'Price: Low to High';
            case 'price_desc': return 'Price: High to Low';
            default: return 'Sort';
        }
    };

    const getTotalStock = (p: Product) => {
        if (p.product_type === 'variable' && Array.isArray(p.variants)) {
            return p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        }
        return Number(p.stock) || 0;
    };

    const getDisplayPrice = (p: Product) => {
        if (p.product_type === 'variable' && Array.isArray(p.variants) && p.variants.length > 0) {
            const prices = p.variants.map(v => Number(v.price));
            return Math.min(...prices); 
        }
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
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const activeParentId = useMemo(() => {
        if (categoryId === 'all') return 'all';
        const isParent = tree.find(c => String(c.id) === categoryId);
        if (isParent) return String(isParent.id);
        for (const parent of tree) {
            if (parent.children?.some(child => String(child.id) === categoryId)) return String(parent.id);
        }
        return 'all';
    }, [categoryId, tree]);

    const activeSubId = useMemo(() => {
        if (categoryId === activeParentId) return 'all';
        return categoryId;
    }, [categoryId, activeParentId]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Inventory</h1>
                    <p className={styles.description}>Showing {products.length} of {totalData} products.</p>
                </div>
                <Link href="/dashboard/products/add" className={styles.addButton}>
                    <Plus size={16} /> Add Product
                </Link>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={20} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search name, brand, or SKU..." 
                        className={styles.searchInput}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>
                
                <div className={styles.filterContainer}>
                    <div className={styles.categoryFilters}>
                        <div className={styles.categoryButtonGroup}>
                            <button className={`${styles.catBtn} ${activeParentId === "all" ? styles.activeCat : ""}`} onClick={() => updateParam('category_id', 'all')}>All Categories</button>
                            {tree.map(cat => (
                                <button key={cat.id} className={`${styles.catBtn} ${activeParentId === String(cat.id) ? styles.activeCat : ""}`} onClick={() => updateParam('category_id', cat.id)}>{cat.name}</button>
                            ))}
                        </div>
                        {activeParentId !== "all" && tree.find(c => String(c.id) === activeParentId)?.children?.length! > 0 && (
                            <div className={styles.subCategoryGroup}>
                                <button className={`${styles.subBtn} ${activeSubId === "all" ? styles.activeSub : ""}`} onClick={() => updateParam('category_id', activeParentId)}>All Sub</button>
                                {tree.find(c => String(c.id) === activeParentId)?.children?.map(child => (
                                    <button key={child.id} className={`${styles.subBtn} ${activeSubId === String(child.id) ? styles.activeSub : ""}`} onClick={() => updateParam('category_id', child.id)}>{child.name}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.actionFilters}>
                        <div className={styles.sortDropdown} ref={dropdownRef}>
                            <button className={styles.sortButton} onClick={() => setIsSortOpen(!isSortOpen)}>
                                <div className={styles.sortBtnLeft}>
                                    <ArrowUpDown size={16} /> 
                                    <span className={styles.sortLabel}>Sort:</span> 
                                    <span className={styles.sortValue}>{getSortText(sortOrder)}</span>
                                </div>
                                <ChevronDown size={16} className={`${styles.chevron} ${isSortOpen ? styles.rotate : ''}`} />
                            </button>
                            {isSortOpen && (
                                <div className={styles.dropdownMenu}>
                                    <button className={`${styles.dropdownItem} ${sortOrder === 'newest' ? styles.activeItem : ''}`} onClick={() => updateParam('sort', 'newest')}>Newest First</button>
                                    <button className={`${styles.dropdownItem} ${sortOrder === 'oldest' ? styles.activeItem : ''}`} onClick={() => updateParam('sort', 'oldest')}>Oldest First</button>
                                    <hr className={styles.divider} />
                                    <button className={`${styles.dropdownItem} ${sortOrder === 'price_asc' ? styles.activeItem : ''}`} onClick={() => updateParam('sort', 'price_asc')}>Price: Low to High</button>
                                    <button className={`${styles.dropdownItem} ${sortOrder === 'price_desc' ? styles.activeItem : ''}`} onClick={() => updateParam('sort', 'price_desc')}>Price: High to Low</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                {isLoading ? (
                    <div className={styles.loadingBox}><Loader2 size={40} className="animate-spin" /></div>
                ) : products.length === 0 ? (
                    <div className={`${styles.emptyState} ${styles.fade}`}>
                        <PackageOpen size={56} strokeWidth={1} className={styles.emptyIcon} />
                        <h3 className={styles.emptyTitle}>No products found</h3>
                        <p className={styles.emptyDesc}>Try adjusting your filters.</p>
                        <button className={styles.clearBtn} onClick={() => router.replace(pathname)}>Clear Filters</button>
                    </div>
                ) : (
                    <>
                        <div className={`${styles.scrollWrapper} ${styles.fade}`}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Product Details</th>
                                        <th className={styles.th}>Price & Stock</th>
                                        <th className={styles.th}>Last Activity</th>
                                        <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => {
                                        if (!product) return null;
                                        const isUpdated = product.updatedAt !== product.createdAt;
                                        const totalStock = getTotalStock(product);
                                        const displayPrice = getDisplayPrice(product);
                                        return (
                                            <tr key={product.id} className={styles.tr}>
                                                <td className={styles.td}>
                                                    <div className={styles.productCell}>
                                                        <div className={styles.imageWrapper}>
                                                            {getImageUrl(product) ? <img src={getImageUrl(product)!} className={styles.productImg} alt={product.name} /> : <ImageIcon size={20} className={styles.placeholderIcon} />}
                                                        </div>
                                                        <div className={styles.productInfo}>
                                                            <div className={styles.statusRow}>
                                                                {product.is_pinned && <span className={styles.badgePinned}><Pin size={10} fill="currentColor" /> Pinned</span>}
                                                                {product.is_best_seller && <span className={styles.badgeBestSeller}><Star size={10} fill="currentColor" /> Best Seller</span>}
                                                            </div>
                                                            <div className={styles.nameRow}><span className={styles.productName}>{product.name}</span></div>
                                                            <div className={styles.categoryRow}>
                                                                {product.category?.parent && (
                                                                    <>
                                                                        <span className={styles.categoryParent}>{product.category.parent.name}</span>
                                                                        <span className={styles.categoryDivider}>/</span>
                                                                    </>
                                                                )}
                                                                <span>{product.category?.name || 'Uncategorized'}</span>
                                                            </div>
                                                            <div className={styles.metaRow}>{product.sku && <span className={styles.sku}>{product.sku}</span>}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={styles.td}>
                                                    <div className={styles.priceText}>${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                                    <div className={totalStock < 5 ? styles.lowStockAlert : styles.inStock}>{totalStock} Units</div>
                                                </td>
                                                <td className={styles.td}>
                                                    <div className={styles.activityBox}>
                                                        <div className={styles.activityStatus}><History size={12} /><span>{isUpdated ? 'Modified' : 'Created'}</span></div>
                                                        <div className={styles.activityDate}>{formatDate(isUpdated ? product.updatedAt : product.createdAt)}</div>
                                                        <div className={styles.activityUser}><User size={12} /><span>{isUpdated ? product.editor?.name : product.creator?.name || 'System'}</span></div>
                                                    </div>
                                                </td>
                                                <td className={styles.td}>
                                                    <div className={styles.actions}>
                                                        <button className={styles.actionBtn} onClick={() => router.push(`/dashboard/products/history/${product.id}`)}><History size={16} /></button>
                                                        <button className={styles.actionBtn} onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}><Pencil size={16} /></button>
                                                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => { if(confirm('Delete product?')) api.delete(`/products/${product.id}`).then(() => fetchProducts()) }}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.paginationContainer}>
                            <button onClick={() => updateParam('page', Math.max(1, page - 1))} disabled={page === 1} className={styles.pageBtn}><ChevronLeft size={18} /> Prev</button>
                            <div className={styles.pageJumper}>
                                <span>Page</span>
                                <input 
                                    type="number" 
                                    className={styles.pageInput} 
                                    value={pageInput} 
                                    onChange={(e) => setPageInput(e.target.value)} 
                                    onBlur={() => {
                                        const p = Math.max(1, Math.min(totalPages, Number(pageInput) || 1));
                                        if (p !== page) updateParam('page', p);
                                        else setPageInput(String(page));
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                />
                                <span>of {totalPages}</span>
                            </div>
                            <button onClick={() => updateParam('page', Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className={styles.pageBtn}>Next <ChevronRight size={18} /></button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}