"use client";

import React from 'react';
import styles from '../app/(dashboard)/dashboard/products/add/page.module.css';

interface Template {
    id: number;
    name: string;
    type: 'text' | 'number' | 'color';
}

interface Props {
    templates: Template[];
    values: Record<number, any>;
    onChange: (id: number, value: any) => void;
}

export default function AttributeForm({ templates, values, onChange }: Props) {
    if (!templates || templates.length === 0) return null;

    return (
        <div className={styles.attrSection}>
            <p className={styles.attrHeader}>Spesifikasi Tambahan</p>
            <div className={styles.row}>
                {templates.map((t) => (
                    <div key={t.id} className={styles.formGroup}>
                        <label className={styles.label}>{t.name}</label>
                        <input
                            type={t.type === 'color' ? 'color' : t.type}
                            className={t.type === 'color' ? styles.colorInput : styles.input}
                            value={values[t.id] || ''}
                            onChange={(e) => onChange(t.id, e.target.value)}
                            placeholder={`Masukkan ${t.name.toLowerCase()}...`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}