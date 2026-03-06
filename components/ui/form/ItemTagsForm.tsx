"use client";

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface ItemTagsFormProps {
  onChange: (tags: string[]) => void;
  styles: any;
  initialData?: string[];
}

export function ItemTagsForm({ onChange, styles, initialData = [] }: ItemTagsFormProps) {
  const [tags, setTags] = useState<string[]>(initialData);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    onChange(tags);
  }, [tags, onChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={styles.priceContainer}>
      <div className={styles.row}>
        <div className={styles.field} style={{ width: '100%' }}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Item Tags</label>
            <span className={styles.helper}>Type a tag and press Enter or comma (,).</span>
          </div>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. bestseller, promo, new-arrival"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {tags.map((tag, index) => (
                <span 
                  key={index} 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    padding: '4px 12px', 
                    backgroundColor: '#e5e7eb', 
                    color: '#374151', 
                    borderRadius: '9999px', 
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {tag}
                  <button 
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{ 
                      marginLeft: '6px', 
                      cursor: 'pointer', 
                      border: 'none', 
                      background: 'transparent', 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '0'
                    }}
                  >
                    <X size={14} color="#6b7280" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}