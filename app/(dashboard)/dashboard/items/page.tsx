"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import { 
    Plus, Pencil, Trash2, Loader2, PackageOpen, 
    ImageIcon, Search, ArrowUpDown, ChevronDown,
    History, User, Pin, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useCategoryTree } from '@/hooks/useCategories';

interface Variant {
    id: string;
    code: string;
    price: string;
    quantity: number;
    prices: { price: string; priceType: string }[];
}

interface Item {
    id: string;
    name: string;
    slug: string;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
    isPinned: boolean;
    isFavorite: boolean;
    category?: {
        name: string;
        parent?: { name: string };
    };
    itemType?: { name: string };
    variants: Variant[];
    images: { id: string; url: string; isPrimary: boolean }[];
    createdAt: string;
    updatedAt: string;
}

export default function ItemsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { tree } = useCategoryTree();
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const page = Number(searchParams.get('page')) || 1;
    const sortOrder = searchParams.get('sort') || 'newest';
    const categoryId = searchParams.get('category_id') || 'all';
    const urlSearch = searchParams.get('search') || '';

    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [localSearch, setLocalSearch] = useState(urlSearch);
    const [isSortOpen, setIsSortOpen] = useState(false);

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

    const fetchItems = async (signal?: AbortSignal) => {
        setIsLoading(true);
        try {
            const params = {
                page,
                limit: 10,
                search: urlSearch,
                sort: sortOrder,
                category_id: categoryId !== 'all' ? categoryId : undefined
            };
            const response = await api.get('/v1/items', { params, signal });
            const { data, meta } = response.data;
            setItems(data || []);
            setTotalPages(meta?.totalPages || 1);
            setTotalData(meta?.total || 0);
        } catch (error: any) {
            if (error.name !== 'CanceledError') {
                notifyError('Failed to load items');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchItems(controller.signal);
        return () => controller.abort();
    }, [page, urlSearch, sortOrder, categoryId]);

    const updateParam = (key: string, value: string | number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') params.set(key, String(value));
        else params.delete(key);
        if (key !== 'page') params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
        setIsSortOpen(false);
    };

    const getPriceRange = (item: Item) => {
        if (!item.variants || item.variants.length === 0) return "N/A";
        const prices = item.variants.map(v => parseFloat(v.price));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max 
            ? `Rp ${min.toLocaleString('id-ID')}` 
            : `Rp ${min.toLocaleString('id-ID')} - ${max.toLocaleString('id-ID')}`;
    };

    const getTotalQty = (item: Item) => {
        return item.variants?.reduce((sum, v) => sum + v.quantity, 0) || 0;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Items (New)</h1>
                    <p className={styles.description}>Prisma-based inventory management.</p>
                </div>
                <Link href="/dashboard/items/add" className={styles.addButton}>
                    <Plus size={16} /> Add New Item
                </Link>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={20} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search items..." 
                        className={styles.searchInput}
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>
                
                <div className={styles.filterRow}>
                    <div className={styles.categoryButtonGroup}>
                        <button 
                            className={`${styles.catBtn} ${categoryId === "all" ? styles.activeCat : ""}`}
                            onClick={() => updateParam('category_id', 'all')}
                        > All </button>
                        {tree.map(cat => (
                            <button 
                                key={cat.id} 
                                className={`${styles.catBtn} ${categoryId === String(cat.id) ? styles.activeCat : ""}`}
                                onClick={() => updateParam('category_id', cat.id)}
                            > {cat.name} </button>
                        ))}
                    </div>

                    <div className={styles.sortDropdown} ref={dropdownRef}>
                        <button className={styles.sortButton} onClick={() => setIsSortOpen(!isSortOpen)}>
                            <ArrowUpDown size={16} />
                            <span>Sort</span>
                            <ChevronDown size={16} className={isSortOpen ? styles.rotate : ''} />
                        </button>
                        {isSortOpen && (
                            <div className={styles.dropdownMenu}>
                                <button onClick={() => updateParam('sort', 'newest')}>Newest</button>
                                <button onClick={() => updateParam('sort', 'price_asc')}>Price: Low to High</button>
                                <button onClick={() => updateParam('sort', 'price_desc')}>Price: High to Low</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                {isLoading ? (
                    <div className={styles.loadingBox}><Loader2 className={styles.spinner} /></div>
                ) : items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <PackageOpen size={48} />
                        <p>No items found.</p>
                    </div>
                ) : (
                    <div className={styles.scrollWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Item Details</th>
                                    <th>Type & Category</th>
                                    <th>Stock & Price</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className={styles.tr}>
                                        <td>
                                            <div className={styles.productInfo}>
                                                <div className={styles.imgPlaceholder}>
                                                    {item.images?.[0] ? <img src={item.images[0].url} alt={item.name} /> : <ImageIcon size={20} />}
                                                </div>
                                                <div>
                                                    <div className={styles.itemName}>{item.name}</div>
                                                    <div className={styles.itemSlug}>{item.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.typeTag}>{item.itemType?.name}</div>
                                            <div className={styles.catText}>{item.category?.name || 'No Category'}</div>
                                        </td>
                                        <td>
                                            <div className={styles.priceText}>{getPriceRange(item)}</div>
                                            <div className={getTotalQty(item) < 10 ? styles.lowStock : styles.stockText}>
                                                {getTotalQty(item)} in stock
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[item.status.toLowerCase()]}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button onClick={() => router.push(`/dashboard/items/edit/${item.id}`)}><Pencil size={16} /></button>
                                                <button className={styles.deleteBtn}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                <div className={styles.pagination}>
                    <button disabled={page === 1} onClick={() => updateParam('page', page - 1)}><ChevronLeft size={18} /></button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => updateParam('page', page + 1)}><ChevronRight size={18} /></button>
                </div>
            </div>
        </div>
    );
}