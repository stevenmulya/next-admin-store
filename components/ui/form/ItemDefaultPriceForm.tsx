"use client";

import React, { useState, useEffect } from 'react';

interface Props {
  onChange: (data: any) => void;
  styles: any;
  initialData?: any;
}

export function ItemDefaultPriceForm({ onChange, styles, initialData }: Props) {
  const [data, setData] = useState({
    basePrice: initialData?.basePrice || 0,
    currency: initialData?.currency || 'USD'
  });

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: name === 'basePrice' ? Number(value) : value }));
  };

  return (
    <div className={styles.priceContainer}>
      <div className={styles.row}>
        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Base Price</label>
            <span className={styles.helper}>Standard price for this item.</span>
          </div>
          <input
            type="number"
            name="basePrice"
            className={styles.input}
            placeholder="0.00"
            value={data.basePrice || ''}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Currency</label>
            <span className={styles.helper}>Primary settlement currency.</span>
          </div>
          <select name="currency" className={styles.select} value={data.currency} onChange={handleChange}>
            <option value="USD">USD - US Dollar</option>
            <option value="IDR">IDR - Indonesian Rupiah</option>
          </select>
        </div>
      </div>
    </div>
  );
}