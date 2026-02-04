"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import { Order } from '@/types/order';
import { 
    Search, Loader2, PackageOpen, 
    Eye, ChevronLeft, ChevronRight, 
    Calendar, CheckCircle, Clock, AlertCircle, Truck, Plus
} from 'lucide-react';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalData, setTotalData] = useState(0);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page,
                limit,
                search: debouncedSearch,
                sort: 'newest'
            };

            const response = await api.get('/orders', { params });
            const { data, meta } = response.data;

            setOrders(Array.isArray(data) ? data : []);
            
            if (meta) {
                setTotalPages(meta.total_pages);
                setTotalData(meta.total_data);
            }

        } catch (error: any) {
            console.error(error);
            if (error.response && error.response.status !== 404) {
                notifyError('Failed to load orders');
            }
            setOrders([]);
            setTotalData(0);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(parseFloat(amount));
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'completed': return <CheckCircle size={12} />;
            case 'processing': return <Loader2 size={12} className="animate-spin" />;
            case 'shipped': return <Truck size={12} />;
            case 'pending': return <Clock size={12} />;
            default: return <AlertCircle size={12} />;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Order Management</h1>
                    <p className={styles.description}>
                        Showing {orders.length} of {totalData} transactions.
                    </p>
                </div>
                <Link href="/dashboard/orders/add" className={styles.addButton}>
                    <Plus size={16} /> Create Order
                </Link>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search invoice number or customer name..." 
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableCard}>
                {isLoading ? (
                    <div className={styles.loadingBox}>
                        <Loader2 size={24} className="animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <PackageOpen size={48} strokeWidth={1} />
                        <p>No orders found matching your criteria.</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.scrollWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Invoice Info</th>
                                        <th className={styles.th}>Customer</th>
                                        <th className={styles.th}>Payment</th>
                                        <th className={styles.th}>Order Status</th>
                                        <th className={styles.th}>Total Amount</th>
                                        <th className={styles.th} style={{ textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr 
                                            key={order.id} 
                                            className={styles.tr} 
                                            onClick={() => router.push(`/dashboard/orders/view/${order.id}`)}
                                        >
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span className={styles.invoice}>{order.invoice_number}</span>
                                                    <div className={styles.date}>
                                                        <Calendar size={12} /> 
                                                        {formatDate((order as any).createdAt || order.created_at)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.profileInfo}>
                                                    <span className={styles.customerName}>
                                                        {order.customer?.name || 'Unknown'}
                                                    </span>
                                                    <span className={styles.customerEmail}>
                                                        {order.customer?.email || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <span className={`${styles.badge} ${styles[order.payment_status]}`}>
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td className={styles.td}>
                                                <span className={`${styles.badge} ${styles[order.order_status]}`}>
                                                    {getStatusIcon(order.order_status)}
                                                    {order.order_status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className={styles.td}>
                                                <span className={styles.totalAmount}>
                                                    {formatCurrency(order.total_amount)}
                                                </span>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.actions}>
                                                    <Link 
                                                        href={`/dashboard/orders/view/${order.id}`} 
                                                        className={styles.actionBtn} 
                                                        title="View Details" 
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Eye size={14} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.paginationContainer}>
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))} 
                                disabled={page === 1}
                                className={styles.pageBtn}
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            
                            <span className={styles.pageInfo}>
                                Page {page} of {totalPages}
                            </span>

                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                                disabled={page === totalPages || totalPages === 0}
                                className={styles.pageBtn}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}