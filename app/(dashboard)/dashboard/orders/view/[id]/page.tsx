"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import { 
    ArrowLeft, Printer, User, MapPin, 
    CreditCard, Calendar, Package, Loader2, 
    CheckCircle, Clock, Truck, AlertCircle 
} from 'lucide-react';

interface OrderItem {
    id: string;
    snap_product_name: string;
    snap_product_sku: string;
    snap_product_price: string;
    quantity: number;
    total_line_price: string;
}

interface Order {
    id: string;
    invoice_number: string;
    created_at: string;
    payment_status: string;
    order_status: string;
    payment_method: string;
    total_items_price: string;
    shipping_cost: string;
    total_amount: string;
    note?: string;
    
    customer?: {
        name: string;
        email: string;
        phone: string;
    };

    snap_recipient_name: string;
    snap_phone: string;
    snap_full_address: string;
    snap_city: string;
    snap_province: string;
    snap_postal_code: string;
    snap_country: string;

    items: OrderItem[];
}

export default function ViewOrderPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/orders/${params.id}`);
                setOrder(response.data.data);
            } catch (error: any) {
                notifyError("Failed to load order details");
                router.push('/dashboard/orders');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchOrder();
        }
    }, [params.id, router]);

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(Number(amount));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'completed': return <CheckCircle size={16} />;
            case 'processing': return <Loader2 size={16} className="animate-spin" />;
            case 'shipped': return <Truck size={16} />;
            case 'pending': return <Clock size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 size={40} className="animate-spin" />
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/dashboard/orders" className={styles.backLink}>
                        <ArrowLeft size={16} /> Back to List
                    </Link>
                    <h1 className={styles.title}>Order {order.invoice_number}</h1>
                    <div className={styles.statusBadges}>
                        <span className={`${styles.badge} ${styles[order.payment_status]}`}>
                            {order.payment_status}
                        </span>
                        <span className={`${styles.badge} ${styles[order.order_status]}`}>
                            {getStatusIcon(order.order_status)}
                            {order.order_status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <button className={styles.printBtn} onClick={() => window.print()}>
                        <Printer size={16} /> Print Invoice
                    </button>
                </div>
            </div>

            <div className={styles.infoGrid}>
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}><User size={18} /> Customer Details</h3>
                    <div className={styles.cardContent}>
                        <p className={styles.infoLabel}>Name</p>
                        <p className={styles.infoValue}>{order.customer?.name || 'Guest'}</p>
                        
                        <p className={styles.infoLabel}>Email</p>
                        <p className={styles.infoValue}>{order.customer?.email || '-'}</p>
                        
                        <p className={styles.infoLabel}>Phone</p>
                        <p className={styles.infoValue}>{order.customer?.phone || '-'}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 className={styles.cardTitle}><MapPin size={18} /> Shipping Address</h3>
                    <div className={styles.cardContent}>
                        <p className={styles.infoValue}><strong>{order.snap_recipient_name}</strong></p>
                        <p className={styles.infoValue}>{order.snap_full_address}</p>
                        <p className={styles.infoValue}>
                            {order.snap_city}, {order.snap_province} {order.snap_postal_code}
                        </p>
                        <p className={styles.infoValue}>{order.snap_country}</p>
                        <p className={styles.infoValue} style={{marginTop: '8px', color: '#555'}}>
                            <small>Phone: {order.snap_phone}</small>
                        </p>
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 className={styles.cardTitle}><CreditCard size={18} /> Payment & Date</h3>
                    <div className={styles.cardContent}>
                        <p className={styles.infoLabel}>Order Date</p>
                        <div className={styles.dateValue}>
                            <Calendar size={14} /> {formatDate(order.created_at)}
                        </div>

                        <p className={styles.infoLabel}>Payment Method</p>
                        <p className={styles.infoValue} style={{textTransform: 'capitalize'}}>
                            {order.payment_method.replace('_', ' ')}
                        </p>

                        {order.note && (
                            <>
                                <p className={styles.infoLabel}>Note</p>
                                <p className={styles.noteBox}>{order.note}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <h3 className={styles.cardTitle}><Package size={18} /> Order Items</h3>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>SKU</th>
                                <th style={{textAlign: 'right'}}>Price</th>
                                <th style={{textAlign: 'center'}}>Qty</th>
                                <th style={{textAlign: 'right'}}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td className={styles.prodName}>{item.snap_product_name}</td>
                                    <td className={styles.sku}>{item.snap_product_sku || '-'}</td>
                                    <td style={{textAlign: 'right'}}>{formatCurrency(item.snap_product_price)}</td>
                                    <td style={{textAlign: 'center'}}>{item.quantity}</td>
                                    <td style={{textAlign: 'right', fontWeight: 600}}>
                                        {formatCurrency(item.total_line_price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={styles.totalsContainer}>
                <div className={styles.totalsBox}>
                    <div className={styles.totalRow}>
                        <span>Subtotal</span>
                        <span>{formatCurrency(order.total_items_price)}</span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>Shipping Cost</span>
                        <span>{formatCurrency(order.shipping_cost)}</span>
                    </div>
                    <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                        <span>Grand Total</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}