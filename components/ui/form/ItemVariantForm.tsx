"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface ItemVariantPayload {
  itemId?: number;
  name: string;
  price?: number;
  stock: number;
  metadata?: Record<string, any>;
}

export interface ItemVariantFormState {
  itemId: number | string;
  name: string;
  price: number | string;
  stock: number | string;
}

export interface MetaField {
  key: string;
  value: string;
}

interface ItemVariantFormProps {
  initialData?: Partial<ItemVariantPayload>;
  fixedItemId?: number;
  items?: { id: number; name: string }[];
  onSubmit: (data: ItemVariantPayload) => void;
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
  styles: Record<string, string>;
}

export function ItemVariantForm({ 
  initialData, 
  fixedItemId, 
  items = [], 
  onSubmit, 
  loading, 
  submitLabel, 
  onCancel, 
  styles 
}: ItemVariantFormProps) {
  const [formData, setFormData] = useState<ItemVariantFormState>({
    itemId: fixedItemId || '',
    name: '',
    price: '',
    stock: 0,
  });

  const [metaFields, setMetaFields] = useState<MetaField[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        itemId: fixedItemId || initialData.itemId || '',
        name: initialData.name || '',
        price: initialData.price ?? '',
        stock: initialData.stock ?? 0,
      });

      if (initialData.metadata) {
        const parsedMeta = Object.entries(initialData.metadata).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setMetaFields(parsedMeta);
      }
    }
  }, [initialData, fixedItemId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMetaChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...metaFields];
    updated[index][field] = value;
    setMetaFields(updated);
  };

  const addMetaField = () => {
    setMetaFields([...metaFields, { key: '', value: '' }]);
  };

  const removeMetaField = (index: number) => {
    setMetaFields(metaFields.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const metadataObject = metaFields.reduce((acc, curr) => {
      if (curr.key.trim() && curr.value.trim()) {
        acc[curr.key.trim()] = curr.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    const payload: ItemVariantPayload = {
      name: formData.name,
      stock: Number(formData.stock),
      metadata: Object.keys(metadataObject).length > 0 ? metadataObject : undefined,
    };

    if (!fixedItemId) {
      payload.itemId = Number(formData.itemId);
    } else {
      payload.itemId = fixedItemId;
    }

    if (formData.price !== '') payload.price = Number(formData.price);

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.section}>
        
        {!fixedItemId && (
          <div className={styles.row}>
            <div className={styles.field}>
              <div className={styles.labelBlock}>
                <label className={styles.label}>Parent Item</label>
                <span className={styles.helper}>Select the item this variant belongs to.</span>
              </div>
              <select 
                name="itemId" 
                required 
                className={styles.select} 
                value={formData.itemId} 
                onChange={handleChange}
              >
                <option value="">Select an Item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Variant Name</label>
              <span className={styles.helper}>e.g., Red - Extra Large</span>
            </div>
            <input 
              type="text" 
              name="name" 
              required 
              className={styles.input} 
              placeholder="Enter variant name" 
              value={formData.name} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Price (Optional)</label>
              <span className={styles.helper}>Override parent item price.</span>
            </div>
            <input 
              type="number" 
              name="price" 
              min="0"
              step="0.01"
              className={styles.input} 
              placeholder="0.00" 
              value={formData.price} 
              onChange={handleChange} 
            />
          </div>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Stock Quantity</label>
              <span className={styles.helper}>Current available inventory.</span>
            </div>
            <input 
              type="number" 
              name="stock" 
              required
              min="0"
              className={styles.input} 
              placeholder="0" 
              value={formData.stock} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className={styles.field} style={{ marginTop: '16px' }}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Variant Metadata (Optional)</label>
            <span className={styles.helper}>Dynamic attributes like Color, Size, Weight, etc.</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {metaFields.map((field, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Key (e.g., Color)" 
                  value={field.key} 
                  onChange={(e) => handleMetaChange(index, 'key', e.target.value)} 
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Value (e.g., Red)" 
                  value={field.value} 
                  onChange={(e) => handleMetaChange(index, 'value', e.target.value)} 
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={() => removeMetaField(index)}
                  style={{ 
                    padding: '8px', 
                    background: 'transparent', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-muted)', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={addMetaField}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'var(--bg-hover)',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                width: 'fit-content',
                fontSize: 'var(--font-sm)',
                fontWeight: 500
              }}
            >
              <Plus size={16} /> Add Attribute
            </button>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Processing...' : submitLabel}
        </button>
      </div>
    </form>
  );
}