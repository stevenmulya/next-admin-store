"use client";

import React, { useState, useEffect } from 'react';
import styles from './UserForm.module.css';

interface SubCategoryFormProps {
  initialData?: any;
  parentId: string | number;
  onSubmit: (data: any) => void;
  loading: boolean;
  submitLabel?: string;
  onCancel: () => void;
}

export function SubCategoryForm({ initialData, parentId, onSubmit, loading, submitLabel, onCancel }: SubCategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [isManualSlug, setIsManualSlug] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || ''
      });
      setIsManualSlug(true);
    }
  }, [initialData]);

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'name' && !isManualSlug) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const handleSlugToggle = () => {
    if (isManualSlug) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
    }
    setIsManualSlug(!isManualSlug);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, parentId: Number(parentId) });
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      <div className={styles.section}>
        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Subcategory Name</label>
            <span className={styles.helper}>Enter the name for this sub-level category.</span>
          </div>
          <input type="text" name="name" required className={styles.input} placeholder="Enter subcategory name here..." value={formData.name} onChange={handleChange} />
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label}>Slug Identifier</label>
              <button type="button" onClick={handleSlugToggle} className={styles.slugToggle} style={{ background: 'none', border: 'none', color: isManualSlug ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700, textTransform: 'uppercase' }}>
                {isManualSlug ? 'Lock Auto' : 'Edit Manual'}
              </button>
            </div>
          </div>
          <input type="text" name="slug" required readOnly={!isManualSlug} className={styles.input} style={{ opacity: isManualSlug ? 1 : 0.6, cursor: isManualSlug ? 'text' : 'not-allowed', fontFamily: 'monospace' }} value={formData.slug} onChange={handleChange} />
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Description</label>
          </div>
          <textarea name="description" className={styles.input} style={{ height: '120px', padding: '12px', resize: 'none' }} placeholder="Enter description here..." value={formData.description} onChange={handleChange} />
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Saving...' : (submitLabel || 'Add Subcategory')}
        </button>
      </div>
    </form>
  );
}