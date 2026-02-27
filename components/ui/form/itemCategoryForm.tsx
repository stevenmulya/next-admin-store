"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface CategoryFormProps {
  initialData?: any;
  parentIdFromUrl?: string | null;
  onSubmit: (data: any) => void;
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
  styles: Record<string, string>;
}

interface SubcategoryState {
  name: string;
  slug: string;
  isManualSlug: boolean;
}

export function CategoryForm({ initialData, parentIdFromUrl, onSubmit, loading, submitLabel, onCancel, styles }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });
  
  const [subcategories, setSubcategories] = useState<SubcategoryState[]>([]);
  const [attributes, setAttributes] = useState<{ key: string }[]>([]);
  const [isManualSlug, setIsManualSlug] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || ''
      });
      
      if (initialData.children && Array.isArray(initialData.children)) {
        setSubcategories(initialData.children.map((sub: any) => ({
          name: sub.name,
          slug: sub.slug,
          isManualSlug: true
        })));
      }

      if (initialData.attributes && Array.isArray(initialData.attributes)) {
        setAttributes(initialData.attributes.map((attr: any) => ({ key: attr.key })));
      }
      
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validSubcategories = subcategories
      .filter(sub => sub.name.trim() !== '' && sub.slug.trim() !== '')
      .map(({ name, slug }) => ({ name, slug }));

    const validAttributes = attributes.filter(attr => attr.key.trim() !== '');

    const payload = {
      ...formData,
      parentId: initialData ? initialData.parentId : (parentIdFromUrl ? Number(parentIdFromUrl) : null),
      subcategories: validSubcategories.length > 0 ? validSubcategories : undefined,
      attributes: validAttributes.length > 0 ? validAttributes : undefined
    };
    onSubmit(payload);
  };

  const listItemStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    background: 'var(--bg-hover)',
    padding: '16px',
    border: '1px solid var(--border-color)'
  };

  const addBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'transparent',
    border: '1px dashed var(--border-color)',
    color: 'var(--text-main)',
    cursor: 'pointer',
    width: 'fit-content',
    fontSize: 'var(--font-sm)',
    fontWeight: 600
  };

  const removeBtnStyle: React.CSSProperties = {
    color: 'var(--danger)',
    background: 'transparent',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    padding: '10px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      <div className={styles.section}>
        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Category Name</label>
              <span className={styles.helper}>Enter the name for this primary category.</span>
            </div>
            <input type="text" name="name" required className={styles.input} placeholder="e.g., Electronics" value={formData.name} onChange={handleChange} />
          </div>

          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className={styles.label}>Slug Identifier</label>
                <button 
                  type="button" 
                  onClick={handleSlugToggle} 
                  style={{ background: 'none', border: 'none', color: isManualSlug ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700, textTransform: 'uppercase' }}
                >
                  {isManualSlug ? 'Lock Auto' : 'Edit Manual'}
                </button>
              </div>
              <span className={styles.helper}>Unique URL-friendly identifier.</span>
            </div>
            <input 
              type="text" 
              name="slug" 
              required 
              readOnly={!isManualSlug} 
              className={styles.input} 
              style={{ opacity: isManualSlug ? 1 : 0.6, cursor: isManualSlug ? 'text' : 'not-allowed', fontFamily: 'monospace' }} 
              value={formData.slug} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Description</label>
            <span className={styles.helper}>Brief explanation or overview of this category.</span>
          </div>
          <textarea name="description" className={styles.textarea} placeholder="Describe this category..." value={formData.description} onChange={handleChange} />
        </div>

        <div className={styles.field} style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed var(--border-color)' }}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Subcategories (Optional)</label>
            <span className={styles.helper}>Create sub-levels under this category directly.</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {subcategories.map((sub, index) => (
              <div key={index} style={listItemStyle}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="Subcategory Name (e.g., Laptops)" 
                      value={sub.name} 
                      onChange={(e) => handleSubcategoryChange(index, 'name', e.target.value)} 
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="slug-auto-generated" 
                      value={sub.slug} 
                      readOnly={!sub.isManualSlug}
                      onChange={(e) => handleSubcategoryChange(index, 'slug', e.target.value)} 
                      style={{ opacity: sub.isManualSlug ? 1 : 0.6, fontFamily: 'monospace', paddingRight: '70px' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => handleSubcategorySlugToggle(index)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: sub.isManualSlug ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700, textTransform: 'uppercase' }}
                    >
                      {sub.isManualSlug ? 'Auto' : 'Edit'}
                    </button>
                  </div>
                </div>
                
                <button type="button" onClick={() => handleRemoveSubcategory(index)} style={removeBtnStyle}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <button type="button" onClick={handleAddSubcategory} style={addBtnStyle}>
              <Plus size={16} /> Add Subcategory
            </button>
          </div>
        </div>

        <div className={styles.field} style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed var(--border-color)' }}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Category Attributes (Optional)</label>
            <span className={styles.helper}>Define required fields for items in this category (e.g., RAM, Storage, Size).</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {attributes.map((attr, index) => (
              <div key={index} style={listItemStyle}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <input 
                    type="text" 
                    className={styles.input} 
                    placeholder="Attribute Name (e.g., Color)" 
                    value={attr.key} 
                    onChange={(e) => handleAttributeChange(index, e.target.value)} 
                  />
                </div>
                <button type="button" onClick={() => handleRemoveAttribute(index)} style={removeBtnStyle}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <button type="button" onClick={handleAddAttribute} style={addBtnStyle}>
              <Plus size={16} /> Add Attribute Field
            </button>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>{loading ? 'Processing...' : submitLabel}</button>
      </div>
    </form>
  );
}