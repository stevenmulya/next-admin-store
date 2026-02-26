"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import styles from './page.module.css';

interface SubcategoryState {
  name: string;
  slug: string;
  isManualSlug: boolean;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params?.id as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  
  const [subcategories, setSubcategories] = useState<SubcategoryState[]>([]);
  const [attributes, setAttributes] = useState<{ key: string }[]>([]);
  const [isManualSlug, setIsManualSlug] = useState(true);

  useEffect(() => {
    if (!categoryId) return;

    const fetchCategory = async () => {
      try {
        const res: any = await api.get(`/item-categories/${categoryId}`);
        const data = res?.data?.data || res?.data;
        
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || ''
        });

        if (data.children && Array.isArray(data.children)) {
          setSubcategories(data.children.map((sub: any) => ({
            name: sub.name,
            slug: sub.slug,
            isManualSlug: true
          })));
        }

        if (data.attributes && Array.isArray(data.attributes)) {
          setAttributes(data.attributes.map((attr: any) => ({ key: attr.key })));
        }
      } catch (error) {
        notifyError("Failed to fetch category details");
        router.push('/dashboard/categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId, router]);

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

  const handleAddSubcategory = () => {
    setSubcategories([...subcategories, { name: '', slug: '', isManualSlug: false }]);
  };

  const handleSubcategoryChange = (index: number, field: 'name' | 'slug', value: string) => {
    const newSubs = [...subcategories];
    newSubs[index][field] = value as never;
    if (field === 'name' && !newSubs[index].isManualSlug) {
      newSubs[index].slug = generateSlug(value);
    }
    setSubcategories(newSubs);
  };

  const handleSubcategorySlugToggle = (index: number) => {
    const newSubs = [...subcategories];
    if (newSubs[index].isManualSlug) {
      newSubs[index].slug = generateSlug(newSubs[index].name);
    }
    newSubs[index].isManualSlug = !newSubs[index].isManualSlug;
    setSubcategories(newSubs);
  };

  const handleRemoveSubcategory = (index: number) => {
    const newSubs = [...subcategories];
    newSubs.splice(index, 1);
    setSubcategories(newSubs);
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: '' }]);
  };

  const handleAttributeChange = (index: number, value: string) => {
    const newAttributes = [...attributes];
    newAttributes[index].key = value;
    setAttributes(newAttributes);
  };

  const handleRemoveAttribute = (index: number) => {
    const newAttributes = [...attributes];
    newAttributes.splice(index, 1);
    setAttributes(newAttributes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const validSubcategories = subcategories
        .filter(sub => sub.name.trim() !== '' && sub.slug.trim() !== '')
        .map(({ name, slug }) => ({ name, slug }));

      const validAttributes = attributes.filter(attr => attr.key.trim() !== '');

      const payload = {
        ...formData,
        subcategories: validSubcategories,
        attributes: validAttributes
      };

      await api.patch(`/item-categories/${categoryId}`, payload);
      notifySuccess("Category updated successfully");
      router.push('/dashboard/categories');
    } catch (error: any) {
      notifyError(new Error(error.response?.data?.message || "Failed to update category"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={20} />
        <span>Loading category data...</span>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={styles.title}>Edit Category</h1>
            <p className={styles.subtitle}>Update category details, subcategories, and required attributes.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <div className={styles.row}>
            <div className={styles.field}>
              <div className={styles.labelBlock}>
                <label className={styles.label}>Category Name</label>
                <span className={styles.helper}>The primary display name for this category.</span>
              </div>
              <input type="text" name="name" required className={styles.input} placeholder="Enter category name" value={formData.name} onChange={handleChange} />
            </div>

            <div className={styles.field}>
              <div className={styles.labelBlock}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className={styles.label}>Slug Identifier</label>
                  <button type="button" onClick={handleSlugToggle} className={styles.slugToggle} style={{ color: isManualSlug ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {isManualSlug ? 'Lock Auto' : 'Edit Manual'}
                  </button>
                </div>
                <span className={styles.helper}>Unique URL identifier.</span>
              </div>
              <input type="text" name="slug" required readOnly={!isManualSlug} className={styles.input} style={{ opacity: isManualSlug ? 1 : 0.6 }} placeholder="Enter category slug" value={formData.slug} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Description</label>
              <span className={styles.helper}>A brief summary or overview of this category.</span>
            </div>
            <textarea name="description" className={styles.textarea} placeholder="Enter category description" value={formData.description} onChange={handleChange} />
          </div>

          <div className={styles.subSection}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Subcategories (Optional)</label>
              <span className={styles.helper}>Add child levels directly under this category.</span>
            </div>
            <div className={styles.listContainer}>
              {subcategories.map((sub, index) => (
                <div key={index} className={styles.inlineRowItem}>
                  <div style={{ flex: 1 }}>
                    <input type="text" className={styles.input} placeholder="Enter subcategory name" value={sub.name} onChange={(e) => handleSubcategoryChange(index, 'name', e.target.value)} />
                  </div>
                  <div className={styles.slugInputWrapper} style={{ flex: 1 }}>
                    <input type="text" className={`${styles.input} ${styles.slugInputInside}`} placeholder="Enter subcategory slug" value={sub.slug} readOnly={!sub.isManualSlug} onChange={(e) => handleSubcategoryChange(index, 'slug', e.target.value)} style={{ opacity: sub.isManualSlug ? 1 : 0.6 }} />
                    <button type="button" onClick={() => handleSubcategorySlugToggle(index)} className={styles.slugInlineToggle} style={{ color: sub.isManualSlug ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {sub.isManualSlug ? 'Auto' : 'Edit'}
                    </button>
                  </div>
                  <button type="button" onClick={() => handleRemoveSubcategory(index)} className={styles.removeBtn}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddSubcategory} className={styles.addBtn}>
                <Plus size={16} /> Add Subcategory
              </button>
            </div>
          </div>

          <div className={styles.subSection}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Category Attributes (Optional)</label>
              <span className={styles.helper}>Define required fields for items in this category.</span>
            </div>
            <div className={styles.listContainer}>
              {attributes.map((attr, index) => (
                <div key={index} className={styles.inlineRowItem}>
                  <input type="text" className={styles.input} placeholder="Enter attribute name" value={attr.key} onChange={(e) => handleAttributeChange(index, e.target.value)} style={{ flex: 1 }} />
                  <button type="button" onClick={() => handleRemoveAttribute(index)} className={styles.removeBtn}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddAttribute} className={styles.addBtn}>
                <Plus size={16} /> Add Attribute Field
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" disabled={submitting} className={styles.submitBtn}>
            {submitting ? 'Updating...' : 'Update Category'}
          </button>
        </div>
      </form>
    </div>
  );
}