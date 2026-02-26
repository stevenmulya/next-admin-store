"use client";

import React, { useState } from 'react';
import { Wand2, Trash2, Plus } from 'lucide-react';

export interface ItemVariantPayload {
  name: string;
  sku?: string;
  price?: number;
  stock: number;
  metadata?: Record<string, string>;
}

interface ItemVariantInputGroupProps {
  variants: ItemVariantPayload[];
  onChange: (variants: ItemVariantPayload[]) => void;
  styles: Record<string, string>;
}

export function ItemVariantInputGroup({ variants, onChange, styles }: ItemVariantInputGroupProps) {
  const [optionType, setOptionType] = useState('');
  const [optionValues, setOptionValues] = useState('');

  const handleGenerate = () => {
    if (!optionValues.trim()) return;

    const valuesArray = optionValues.split(',').map(v => v.trim()).filter(v => v !== '');
    
    if (valuesArray.length === 0) return;

    const newVariants: ItemVariantPayload[] = valuesArray.map(val => {
      const variantName = optionType.trim() ? `${optionType.trim()} - ${val}` : val;
      
      const metadata: Record<string, string> = {};
      if (optionType.trim()) {
        metadata[optionType.trim()] = val;
      }

      return {
        name: variantName,
        stock: 0,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };
    });

    onChange([...variants, ...newVariants]);
    setOptionType('');
    setOptionValues('');
  };

  const handleAddManual = () => {
    onChange([...variants, { name: 'New Variant', stock: 0 }]);
  };

  const handleUpdateVariant = (index: number, field: keyof ItemVariantPayload, value: any) => {
    const updated = [...variants];
    
    if (field === 'price' || field === 'stock') {
      const numValue = value === '' ? undefined : Number(value);
      updated[index] = { ...updated[index], [field]: numValue };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    onChange(updated);
  };

  const handleRemoveVariant = (index: number) => {
    const updated = [...variants];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ padding: '20px', backgroundColor: 'var(--bg-page)', border: '1px dashed var(--border-color)' }}>
        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Variant Type</label>
              <span className={styles.helper}>Optional category (e.g., Size, Color).</span>
            </div>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g., Size" 
              value={optionType} 
              onChange={(e) => setOptionType(e.target.value)} 
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Variant Values</label>
              <span className={styles.helper}>Comma separated (e.g., S, M, XL).</span>
            </div>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="e.g., S, M, XL" 
              value={optionValues} 
              onChange={(e) => setOptionValues(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>
        </div>

        <button 
          type="button" 
          onClick={handleGenerate}
          disabled={!optionValues.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            height: '40px',
            marginTop: '24px',
            backgroundColor: optionValues.trim() ? 'var(--bg-active)' : 'var(--bg-input)',
            color: optionValues.trim() ? 'var(--text-on-active)' : 'var(--text-muted)',
            border: optionValues.trim() ? 'none' : '1px solid var(--border-color)',
            cursor: optionValues.trim() ? 'pointer' : 'not-allowed',
            width: '100%',
            fontWeight: 600,
            fontSize: 'var(--font-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          <Wand2 size={16} /> Generate Variants
        </button>
      </div>

      {variants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className={styles.labelBlock} style={{ minHeight: 'auto' }}>
              <label className={styles.label}>Generated Variants ({variants.length})</label>
              <span className={styles.helper}>Adjust details for each generated variant below.</span>
            </div>
            <button 
              type="button" 
              onClick={handleAddManual}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-main)', 
                fontSize: 'var(--font-sm)', 
                fontWeight: 600, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}
            >
              <Plus size={16} /> Add Empty Row
            </button>
          </div>
          
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Variant Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>SKU</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Price Override</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, width: '120px' }}>Stock</th>
                  <th style={{ padding: '12px 16px', width: '50px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={i} style={{ borderBottom: i === variants.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="text" 
                        value={v.name} 
                        onChange={(e) => handleUpdateVariant(i, 'name', e.target.value)}
                        className={styles.input}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="text" 
                        value={v.sku || ''} 
                        placeholder="Auto/Empty"
                        onChange={(e) => handleUpdateVariant(i, 'sku', e.target.value)}
                        className={styles.input}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="number" 
                        value={v.price === undefined ? '' : v.price} 
                        placeholder="Inherit Base Price"
                        onChange={(e) => handleUpdateVariant(i, 'price', e.target.value)}
                        className={styles.input}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="number" 
                        value={v.stock === undefined ? 0 : v.stock} 
                        min="0"
                        onChange={(e) => handleUpdateVariant(i, 'stock', e.target.value)}
                        className={styles.input}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVariant(i)}
                        style={{ 
                          color: 'var(--danger)', 
                          background: 'transparent', 
                          border: 'none', 
                          cursor: 'pointer', 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}