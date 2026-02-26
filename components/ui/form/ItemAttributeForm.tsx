"use client";

import React from 'react';

interface Attribute {
  id: number;
  key: string;
}

interface ItemAttributeFormProps {
  attributes: Attribute[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  styles: Record<string, string>;
}

export function ItemAttributeForm({ attributes, values, onChange, styles }: ItemAttributeFormProps) {
  if (attributes.length === 0) return null;

  return (
    <div style={{ 
      marginTop: '24px', 
      padding: '24px', 
      background: 'var(--bg-hover)', 
      border: '1px solid var(--border-color)',
    }}>
      <h4 style={{ 
        marginBottom: '20px', 
        fontSize: '11px', 
        fontWeight: 800, 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em',
        color: 'var(--text-main)'
      }}>
        Technical Specifications
      </h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '24px' 
      }}>
        {attributes.map((attr) => (
          <div key={attr.id} className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>{attr.key}</label>
            </div>
            <input 
              type="text" 
              className={styles.input} 
              placeholder={`Enter ${attr.key.toLowerCase()}...`}
              value={values[attr.key] || ''}
              onChange={(e) => onChange(attr.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}