"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { 
    Plus, Search, Loader2, PackageOpen, 
    Mail, Phone, Clock, Calendar,
    ShieldCheck, Trash2, Eye, Copy, 
    ChevronLeft, ChevronRight, User
} from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    is_verified: boolean;
    is_active: boolean;
    last_login_at?: string;
    createdAt: string;
}

export default function CustomerListPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
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

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page,
                limit,
                search: debouncedSearch,
                sort: 'newest'
            };

            const response = await api.get('/customers', { params });
            const { data, meta } = response.data;

            setCustomers(Array.isArray(data) ? data : []);
            if (meta) {
                setTotalPages(meta.total_pages);
                setTotalData(meta.total_data);
            }
        } catch (error) {
            notifyError('Failed to load customers');
            setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
        try {
            await api.delete(`/customers/${id}`);
            notifySuccess('Customer removed successfully');
            fetchCustomers();
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Delete failed');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        notifySuccess('Email copied to clipboard');
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Customer Management</h1>
                    <p className={styles.description}>
                        Showing {customers.length} of {totalData} registered users.
                    </p>
                </div>
                <Link href="/dashboard/users/add" className={styles.addButton}>
                    <Plus size={16} /> Add Customer
                </Link>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search name, email, or phone..." 
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableCard}>
                {isLoading ? (
                    <div className={styles.loadingBox}><Loader2 size={24} className="animate-spin" /></div>
                ) : customers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <PackageOpen size={48} strokeWidth={1} />
                        <p>No customers found matching your criteria.</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.scrollWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>Customer Profile</th>
                                        <th className={styles.th}>Status</th>
                                        <th className={styles.th}>Contact Info</th>
                                        <th className={styles.th}>Activity</th>
                                        <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map((customer) => (
                                        <tr key={customer.id} className={styles.tr} onClick={() => router.push(`/dashboard/users/view/${customer.id}`)}>
                                            <td className={styles.td}>
                                                <div className={styles.profileCell}>
                                                    <div className={styles.avatar}>
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className={styles.profileInfo}>
                                                        <span className={styles.customerName}>{customer.name}</span>
                                                        <span className={styles.customerId}>ID: {customer.id.slice(0, 8)}...</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.statusStack}>
                                                    {customer.is_verified ? (
                                                        <span className={styles.badgeVerified}>
                                                            <ShieldCheck size={10} /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className={styles.badgeUnverified}>
                                                            Unverified
                                                        </span>
                                                    )}
                                                    {customer.is_active ? (
                                                        <span className={styles.badgeActive}>Active</span>
                                                    ) : (
                                                        <span className={styles.badgeBanned}>Banned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.contactStack}>
                                                    <div 
                                                        className={styles.contactRow} 
                                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(customer.email); }}
                                                        title="Click to copy email"
                                                    >
                                                        <Mail size={12} /> {customer.email}
                                                    </div>
                                                    <div className={styles.contactRow}>
                                                        <Phone size={12} /> {customer.phone || '-'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.activityBox}>
                                                    <div className={styles.activityRow}>
                                                        <Clock size={10} />
                                                        <span>Login: {formatDate(customer.last_login_at)}</span>
                                                    </div>
                                                    <div className={styles.activityRow}>
                                                        <Calendar size={10} />
                                                        <span>Joined: {formatDate(customer.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.actions}>
                                                    <Link href={`/dashboard/users/view/${customer.id}`} className={styles.actionBtn} title="View Details" onClick={(e) => e.stopPropagation()}>
                                                        <Eye size={14} />
                                                    </Link>
                                                    <button 
                                                        className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                                                        title="Delete Customer" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(customer.id);
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
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