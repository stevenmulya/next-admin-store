"use client";

import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export interface ItemPayload {
  name: string;
  slug: string;
  categoryId: number | null;
  status: string;
  description: string;
  isPinned: boolean;
  isHighlight: boolean;
}

export interface ItemFormState {
  name: string;
  slug: string;
  categoryId: number | string;
  subCategoryId: number | string;
  status: string;
  description: string;
  isPinned: boolean;
  isHighlight: boolean;
}

export interface Category {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface ItemFormProps {
  initialData?: any;
  onSubmit: (data: ItemPayload) => void;
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
  extraContent?: React.ReactNode;
  styles: Record<string, string>;
}

export function ItemForm({ initialData, onSubmit, loading, submitLabel, onCancel, extraContent, styles }: ItemFormProps) {
  const [formData, setFormData] = useState<ItemFormState>({
    name: '',
    slug: '',
    categoryId: '',
    subCategoryId: '',
    status: 'DRAFT',
    description: '',
    isPinned: false,
    isHighlight: false
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/item-categories?isRoot=true&limit=100');
        const items = res?.data?.data?.items || res?.data?.items || [];
        setCategories(items);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!formData.categoryId) {
        setSubCategories([]);
        return;
      }
      try {
        const res = await api.get(`/item-categories?parentId=${formData.categoryId}&limit=100`);
        const items = res?.data?.data?.items || res?.data?.items || [];
        setSubCategories(items);
      } catch (err) {
        setSubCategories([]);
      }
    };
    fetchSubCategories();
  }, [formData.categoryId]);

  useEffect(() => {
    if (initialData) {
      let mainCatId = initialData.categoryId ?? '';
      let subCatId = '';

      if (initialData.category && initialData.category.parentId) {
        mainCatId = initialData.category.parentId;
        subCatId = initialData.categoryId;
      }

      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        categoryId: mainCatId,
        subCategoryId: subCatId,
        status: initialData.status || 'DRAFT',
        description: initialData.description || '',
        isPinned: initialData.isPinned ?? false,
        isHighlight: initialData.isHighlight ?? false,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' && !initialData) {
        newData.slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (name === 'categoryId') newData.subCategoryId = '';
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategoryId = formData.subCategoryId || formData.categoryId;
    
    const payload: ItemPayload = {
      name: formData.name,
      slug: formData.slug,
      categoryId: finalCategoryId ? Number(finalCategoryId) : null,
      status: formData.status,
      description: formData.description,
      isPinned: formData.isPinned,
      isHighlight: formData.isHighlight,
    };
    
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.section}>
        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Item Name</label>
              <span className={styles.helper}>The official name of the item.</span>
            </div>
            <input type="text" name="name" required className={styles.input} placeholder="Enter item name" value={formData.name} onChange={handleChange} />
          </div>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Slug Identifier</label>
              <span className={styles.helper}>Unique URL-friendly identifier.</span>
            </div>
            <input type="text" name="slug" required className={styles.input} placeholder="item-slug-example" value={formData.slug} onChange={handleChange} />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Category</label>
              <span className={styles.helper}>Select primary category.</span>
            </div>
            <select name="categoryId" className={styles.select} value={formData.categoryId} onChange={handleChange}>
              <option value="">None / Uncategorized</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Subcategory</label>
              <span className={styles.helper}>Select specific subcategory.</span>
            </div>
            <select name="subCategoryId" className={styles.select} value={formData.subCategoryId} onChange={handleChange} disabled={!formData.categoryId || subCategories.length === 0}>
              <option value="">Select Subcategory</option>
              {subCategories.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Publish Status</label>
              <span className={styles.helper}>Current visibility of the item.</span>
            </div>
            <select name="status" className={styles.select} value={formData.status} onChange={handleChange}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="isPinned" checked={formData.isPinned} onChange={handleChange} className={styles.checkboxInput} />
            <div className={styles.checkboxText}>
              <span className={styles.label}>Pin Item</span>
              <span className={styles.helper}>Top of lists.</span>
            </div>
          </label>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" name="isHighlight" checked={formData.isHighlight} onChange={handleChange} className={styles.checkboxInput} />
            <div className={styles.checkboxText}>
              <span className={styles.label}>Highlight Item</span>
              <span className={styles.helper}>Special sections.</span>
            </div>
          </label>
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Short Description</label>
            <span className={styles.helper}>Overview of features.</span>
          </div>
          <textarea name="description" className={styles.textarea} placeholder="Describe the item here..." value={formData.description} onChange={handleChange} />
        </div>
      </div>

      {extraContent}

      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>{loading ? 'Processing...' : submitLabel}</button>
      </div>
    </form>
  );
}