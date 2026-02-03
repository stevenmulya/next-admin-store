"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError } from '@/utils/toastHelper';
import { 
    Loader2, ArrowLeft, User, Mail, Phone, 
    MapPin, Calendar, ShieldCheck, Clock, ClipboardList,
    Info, Hash
} from 'lucide-react';

interface CustomerAddress {
    id: string;
    label: string;
    recipient_name: string;
    phone: string;
    full_address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    district: string;
    note?: string;
    is_primary: boolean;
}

interface SurveyResponse {
    id: number;
    answer: string;
    field: {
        label: string;
    };
}

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    is_verified: boolean;
    is_active: boolean;
    last_login_at?: string;
    createdAt: string;
    addresses?: CustomerAddress[];
    responses?: SurveyResponse[];
}

export default function ViewCustomerPage() {
    const params = useParams();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await api.get(`/customers/${params.id}`);
                setCustomer(response.data.data);
            } catch (error) {
                notifyError('Failed to load customer details');
            } finally {
                setIsLoading(false);
            }
        };
        if (params.id) fetchCustomer();
    }, [params.id]);

    if (isLoading) {
        return <div className={styles.loadingContainer}><Loader2 size={32} className="animate-spin" /></div>;
    }

    if (!customer) {
        return <div className={styles.errorContainer}>Customer not found</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Customer Profile</h1>
                    <p className={styles.subtitle}>Detailed overview of customer identity and activity.</p>
                </div>
                <Link href="/dashboard/users" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to List
                </Link>
            </div>

            <div className={styles.grid}>
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <div className={styles.profileHeader}>
                            <div className={styles.avatar}>
                                {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className={styles.profileName}>{customer.name}</h2>
                            <p className={styles.profileEmail}>{customer.email}</p>
                            <div className={styles.badges}>
                                {customer.is_verified && <span className={styles.badgeVerified}><ShieldCheck size={12}/> Verified</span>}
                                {customer.is_active ? <span className={styles.badgeActive}>Active</span> : <span className={styles.badgeInactive}>Inactive</span>}
                            </div>
                        </div>
                        
                        <div className={styles.divider}></div>

                        <div className={styles.detailList}>
                            <div className={styles.detailItem}>
                                <Phone size={16} className={styles.icon} />
                                <div className={styles.detailContent}>
                                    <span className={styles.label}>Phone</span>
                                    <p className={styles.value}>{customer.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <Calendar size={16} className={styles.icon} />
                                <div className={styles.detailContent}>
                                    <span className={styles.label}>Registered</span>
                                    <p className={styles.value}>{new Date(customer.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <Clock size={16} className={styles.icon} />
                                <div className={styles.detailContent}>
                                    <span className={styles.label}>Last Login</span>
                                    <p className={styles.value}>{customer.last_login_at ? new Date(customer.last_login_at).toLocaleString('id-ID') : 'Never'}</p>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <Hash size={16} className={styles.icon} />
                                <div className={styles.detailContent}>
                                    <span className={styles.label}>Customer ID</span>
                                    <p className={styles.valueSmall}>{customer.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><MapPin size={18} /> Addresses</h3>
                        {customer.addresses && customer.addresses.length > 0 ? (
                            <div className={styles.addressList}>
                                {customer.addresses.map((addr) => (
                                    <div key={addr.id} className={`${styles.addressBox} ${addr.is_primary ? styles.primaryBorder : ''}`}>
                                        <div className={styles.addrHeader}>
                                            <span className={styles.addrLabel}>{addr.label}</span>
                                            {addr.is_primary && <span className={styles.primaryTag}>Primary</span>}
                                        </div>
                                        <div className={styles.addrRecipient}>
                                            <strong>{addr.recipient_name}</strong> • {addr.phone}
                                        </div>
                                        <p className={styles.addrText}>{addr.full_address}</p>
                                        <p className={styles.addrSubText}>
                                            {addr.district ? `${addr.district}, ` : ''}{addr.city}, {addr.state}, {addr.country} {addr.postal_code}
                                        </p>
                                        {addr.note && (
                                            <div className={styles.addrNote}>
                                                <Info size={12} /> {addr.note}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.emptyText}>No registered addresses.</p>
                        )}
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><ClipboardList size={18} /> Survey Responses</h3>
                        {customer.responses && customer.responses.length > 0 ? (
                            <div className={styles.surveyContainer}>
                                {customer.responses.map((res) => (
                                    <div key={res.id} className={styles.surveyItem}>
                                        <p className={styles.surveyQuestion}>{res.field.label}</p>
                                        <p className={styles.surveyAnswer}>{res.answer}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.emptyText}>No survey data available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}