"use client";

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import styles from './ItemForm.module.css';

interface ItemFormProps {
  initialData?: {
    name: string;
    slug: string;
    categoryId: number | string;
    status: string;
    description: string;
  };
  onSubmit: (data: any) => void;
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
}

export function ItemForm({ initialData, onSubmit, loading, submitLabel, onCancel }: ItemFormProps) {
  // Tambahkan tipe data eksplisit pada useState
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    categoryId: string | number;
    status: string;
    description: string;
  }>({
    name: '',
    slug: '',
    categoryId: '',
    status: 'DRAFT',
    description: ''
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res: any = await api.get('/item-categories');
        const items = res?.data?.data?.items || res?.data?.items || [];
        setCategories(items);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        slug: initialData.slug,
        categoryId: initialData.categoryId ?? '',
        status: initialData.status,
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      // Pastikan return type sesuai dengan prevState
      const newData = { ...prev, [name]: value };
      
      if (name === 'name' && !initialData) {
        newData.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      
      return newData;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      categoryId: formData.categoryId !== '' ? Number(formData.categoryId) : null
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      <div className={styles.section}>
        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Product Name</label>
            <span className={styles.helper}>Enter the official name of the item.</span>
          </div>
          <input
            type="text"
            name="name"
            required
            className={styles.input}
            placeholder="e.g. Wireless Gaming Mouse"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Slug Identifier</label>
            <span className={styles.helper}>Unique URL-friendly name.</span>
          </div>
          <input
            type="text"
            name="slug"
            required
            className={styles.input}
            placeholder="wireless-gaming-mouse"
            value={formData.slug}
            onChange={handleChange}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Category</label>
              <span className={styles.helper}>Assign this item to a category.</span>
            </div>
            <select
              name="categoryId"
              className={styles.select}
              value={formData.categoryId}
              onChange={handleChange}
            >
              <option value="">None / Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Publish Status</label>
              <span className={styles.helper}>Control visibility in the catalog.</span>
            </div>
            <select
              name="status"
              className={styles.select}
              value={formData.status}
              onChange={handleChange}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Short Description</label>
            <span className={styles.helper}>Brief overview of the product features.</span>
          </div>
          <textarea
            name="description"
            className={styles.input}
            style={{ height: '80px', padding: '10px', resize: 'none' }}
            placeholder="Describe the product..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Discard
        </button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Processing...' : submitLabel}
        </button>
      </div>
    </form>
  );
}