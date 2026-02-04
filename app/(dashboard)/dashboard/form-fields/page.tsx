"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { 
    Plus, Search, Trash2, Loader2, 
    CheckCircle2, XCircle, HelpCircle, 
    Trophy
} from 'lucide-react';

interface FormField {
    id: number;
    label: string;
    options: any;
    is_required: boolean;
    is_active: boolean;
    stats?: {
        counts: { [key: string]: number };
        total: number;
        topAnswers: string[];
        firstResponse: string | null;
        lastResponse: string | null;
    };
}

export default function FormFieldsPage() {
    const [fields, setFields] = useState<FormField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const ensureArray = (options: any): string[] => {
        if (!options) return [];
        if (Array.isArray(options)) return options;
        if (typeof options === 'string') {
            try {
                const parsed = JSON.parse(options);
                return Array.isArray(parsed) ? parsed : [options];
            } catch {
                return options.split(',').map(s => s.trim()).filter(s => s !== '');
            }
        }
        return [];
    };

    const fetchFields = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/customers/manage/fields');
            setFields(response.data.data);
        } catch (error) { notifyError('Failed to load data'); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchFields(); }, []);

    const handleToggleStatus = async (id: number) => {
        try {
            await api.patch(`/customers/manage/fields/${id}/toggle`);
            fetchFields();
        } catch (error) { notifyError('Update failed'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete permanently?')) return;
        try {
            await api.delete(`/customers/manage/fields/${id}`);
            fetchFields();
        } catch (error) { notifyError('Delete failed'); }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('id-ID', { 
            day: '2-digit', month: 'short', year: 'numeric' 
        });
    };

    const filteredFields = fields.filter(f => 
        f.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h1 className={styles.title}>Survey Statistics</h1>
                    <p className={styles.subtitle}>Real-time insights and winner tracking.</p>
                </div>
                <Link href="/dashboard/form-fields/add" className={styles.addButton}>
                    <Plus size={16} /> New Question
                </Link>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" placeholder="Search questions..." 
                        className={styles.searchInput} value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableWrapper}>
                {isLoading ? (
                    <div className={styles.loadingState}><Loader2 size={24} className="animate-spin" /></div>
                ) : filteredFields.length === 0 ? (
                    <div className={styles.emptyState}><HelpCircle size={40} /><p>No data found.</p></div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Question & Top Answers</th>
                                <th className={styles.th}>Activity Period</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFields.map((field) => (
                                <tr key={field.id} className={styles.tr}>
                                    <td className={styles.td}>
                                        <div className={styles.fieldMain}>
                                            <span className={styles.fieldLabel}>{field.label}</span>
                                            
                                            {field.stats && field.stats.topAnswers.length > 0 && (
                                                <div className={styles.topAnswersWrapper}>
                                                    <Trophy size={12} className={styles.trophyIcon} />
                                                    <span className={styles.topLabel}>Top Answers:</span>
                                                    <div className={styles.topBadges}>
                                                        {field.stats.topAnswers.map((ans, idx) => (
                                                            <span key={idx} className={styles.topBadge}>{ans}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className={styles.statsContainer}>
                                                {ensureArray(field.options).map((option) => {
                                                    const count = field.stats?.counts[option] || 0;
                                                    const total = field.stats?.total || 0;
                                                    const percentage = total > 0 ? (count / total) * 100 : 0;
                                                    return (
                                                        <div key={option} className={styles.statRow}>
                                                            <div className={styles.statInfo}>
                                                                <span className={styles.optionText}>{option}</span>
                                                                <span className={styles.countText}>{count}/{total}</span>
                                                            </div>
                                                            <div className={styles.progressBar}>
                                                                <div className={styles.progressFill} style={{ width: `${percentage}%` }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.timeBox}>
                                            <div className={styles.timeItem}>
                                                <span className={styles.timeLabel}>First Response</span>
                                                <span className={styles.timeValue}>{formatDate(field.stats?.firstResponse)}</span>
                                            </div>
                                            <div className={styles.timeItem}>
                                                <span className={styles.timeLabel}>Last Response</span>
                                                <span className={styles.timeValue}>{formatDate(field.stats?.lastResponse)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={styles.td}>
                                        <button 
                                            className={`${styles.statusToggle} ${field.is_active ? styles.active : styles.inactive}`}
                                            onClick={() => handleToggleStatus(field.id)}
                                        >
                                            {field.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                            {field.is_active ? 'Active' : 'Hidden'}
                                        </button>
                                    </td>
                                    <td className={styles.td}>
                                        <button className={styles.deleteBtn} onClick={() => handleDelete(field.id)}><Trash2 size={14} /></button>
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