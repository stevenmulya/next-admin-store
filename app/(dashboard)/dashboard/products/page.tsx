"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Loader2, PackageOpen } from 'lucide-react';

export default function ProductsPage() {
    // Definisi tipe data agar TypeScript senang
    interface Product {
        _id: string;
        name: string;
        price: number;
        category: string;
        brand: string;
        countInStock: number;
    }

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            // Handle jika backend return { products: [...] } atau langsung [...]
            setProducts(data.products || data); 
        } catch (error) {
            toast.error('Unable to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string) => {
        // Konfirmasi sederhana browser
        if (!confirm('Permanently delete this item?')) return;
        
        try {
            await api.delete(`/products/${id}`);
            toast.success('Product deleted');
            fetchProducts(); // Refresh data otomatis
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Inventory</h1>
                <Link href="/dashboard/products/add" className={styles.addButton}>
                    <Plus size={16} />
                    Add New
                </Link>
            </div>

            {/* Table Content */}
            <div className={styles.tableContainer}>
                {isLoading ? (
                    <div className={styles.loadingContainer}>
                        <Loader2 size={24} className="animate-spin" />
                    </div>
                ) : products.length === 0 ? (
                    <div className={styles.emptyState}>
                        <PackageOpen size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No products found in inventory.</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead className={styles.thead}>
                            <tr>
                                <th className={styles.th}>Product Name</th>
                                <th className={styles.th}>Category</th>
                                <th className={styles.th}>Brand</th>
                                <th className={styles.th}>Stock</th>
                                <th className={styles.th}>Price</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product._id} className={styles.tr}>
                                    <td className={`${styles.td} ${styles.productName}`}>
                                        {product.name}
                                    </td>
                                    <td className={styles.td}>{product.category}</td>
                                    <td className={styles.td}>{product.brand}</td>
                                    <td className={styles.td}>
                                        {product.countInStock > 0 ? (
                                            <span style={{ color: '#10b981', fontWeight: 500 }}>{product.countInStock} units</span>
                                        ) : (
                                            <span style={{ color: '#ef4444', fontWeight: 500 }}>Out of Stock</span>
                                        )}
                                    </td>
                                    <td className={`${styles.td} ${styles.price}`}>
                                        ${product.price.toLocaleString()}
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.actions}>
                                            <button 
                                                className={styles.actionBtn} 
                                                title="Edit"
                                                onClick={() => toast('Edit feature coming soon', { icon: '🚧' })}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button 
                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                title="Delete"
                                                onClick={() => handleDelete(product._id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}