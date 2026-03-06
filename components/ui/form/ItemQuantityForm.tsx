"use client";

import React, { useState, useEffect } from 'react';

interface QuantityData {
  stock: number;
  lowStock: number;
}

interface ItemQuantityFormProps {
  onChange: (data: QuantityData | null) => void;
  styles: any;
  initialData?: any;
}

export function ItemQuantityForm({ onChange, styles, initialData }: ItemQuantityFormProps) {
  const [data, setData] = useState<QuantityData>({
    stock: initialData?.stock ?? 0,
    lowStock: initialData?.lowStock ?? 5
  });

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  return (
    <div className={styles.priceContainer}>
      <div className={styles.row}>
        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Total Stock</label>
            <span className={styles.helper}>Total amount of items available.</span>
          </div>
          <input
            type="number"
            name="stock"
            min="0"
            value={data.stock}
            onChange={handleChange}
            className={styles.input}
            placeholder="0"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Low Stock Threshold</label>
            <span className={styles.helper}>Notify when stock reaches this level.</span>
          </div>
          <input
            type="number"
            name="lowStock"
            min="0"
            value={data.lowStock}
            onChange={handleChange}
            className={styles.input}
            placeholder="5"
          />
        </div>
      </div>
    </div>
  );
}