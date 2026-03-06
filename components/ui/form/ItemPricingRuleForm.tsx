"use client";

import React, { useState, useEffect } from 'react';

export interface PricingRulePayload {
  name: string;
  priority: number;
  customPrice: number;
  discountPercentage: number;
  isPercentageRule: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek: number[];
  variantId?: number | null;
}

interface ItemPricingRuleFormProps {
  initialData?: Record<string, any>;
  basePrice: number;
  variants?: any[];
  onSubmit: (data: PricingRulePayload) => void;
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
  styles: Record<string, string>;
}

export function ItemPricingRuleForm({
  initialData,
  basePrice,
  variants = [],
  onSubmit,
  loading,
  submitLabel,
  onCancel,
  styles
}: ItemPricingRuleFormProps) {
  const [activeBasePrice, setActiveBasePrice] = useState<number>(basePrice);

  const [formData, setFormData] = useState({
    name: '',
    priority: 0,
    customPrice: basePrice,
    discountPercentage: 0,
    isPercentageRule: false,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [] as number[],
    variantId: '' as string | number,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        priority: initialData.priority || 0,
        customPrice: initialData.customPrice || basePrice,
        discountPercentage: initialData.discountPercentage || 0,
        isPercentageRule: initialData.isPercentageRule || false,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        daysOfWeek: initialData.daysOfWeek || [],
        variantId: initialData.variantId || '',
      });
    } else {
      setFormData(prev => ({ ...prev, customPrice: basePrice }));
    }
  }, [initialData, basePrice]);

  useEffect(() => {
    if (formData.variantId && formData.variantId !== '') {
      const selectedVariant = variants.find(v => v.id === Number(formData.variantId));
      if (selectedVariant && selectedVariant.price) {
        setActiveBasePrice(Number(selectedVariant.price));
      } else {
        setActiveBasePrice(basePrice);
      }
    } else {
      setActiveBasePrice(basePrice);
    }
  }, [formData.variantId, variants, basePrice]);

  const handlePriceChange = (value: number) => {
    const percentage = activeBasePrice > 0 ? ((activeBasePrice - value) / activeBasePrice) * 100 : 0;
    
    setFormData(prev => ({
      ...prev,
      customPrice: value,
      discountPercentage: Number(percentage.toFixed(2)),
      isPercentageRule: false
    }));
  };

  const handleDiscountChange = (percentage: number) => {
    const value = activeBasePrice - (activeBasePrice * (percentage / 100));
    
    setFormData(prev => ({
      ...prev,
      discountPercentage: percentage,
      customPrice: Number(value.toFixed(2)),
      isPercentageRule: true
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day) 
        ? prev.daysOfWeek.filter(d => d !== day) 
        : [...prev.daysOfWeek, day]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: PricingRulePayload = {
      name: formData.name,
      priority: Number(formData.priority),
      customPrice: Number(formData.customPrice),
      discountPercentage: Number(formData.discountPercentage),
      isPercentageRule: formData.isPercentageRule,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      daysOfWeek: formData.daysOfWeek,
      variantId: formData.variantId ? Number(formData.variantId) : null,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.section}>
        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Rule Name</label>
              <span className={styles.helper}>e.g. Weekend Promo, Happy Hour</span>
            </div>
            <input 
              type="text" 
              name="name" 
              required 
              className={styles.input} 
              placeholder="Enter rule name" 
              value={formData.name} 
              onChange={handleChange} 
            />
          </div>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Priority Level</label>
              <span className={styles.helper}>Higher number takes precedence.</span>
            </div>
            <input 
              type="number" 
              name="priority" 
              required 
              className={styles.input} 
              value={formData.priority} 
              onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))} 
            />
          </div>
        </div>

        {variants && variants.length > 0 && (
          <div className={styles.row}>
            <div className={styles.field} style={{ width: '100%' }}>
              <div className={styles.labelBlock}>
                <label className={styles.label}>Target Variant</label>
                <span className={styles.helper}>Select variant or apply to all.</span>
              </div>
              <select name="variantId" className={styles.select} value={formData.variantId} onChange={handleChange}>
                <option value="">Apply to all variants</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id}>{v.name.toUpperCase()} (SKU: {v.sku || 'N/A'})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Custom Price (Value)</label>
              <span className={styles.helper}>Calculated from {activeBasePrice}</span>
            </div>
            <input 
              type="number" 
              step="0.01" 
              className={styles.input} 
              value={formData.customPrice} 
              onChange={e => handlePriceChange(Number(e.target.value))} 
            />
          </div>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Discount Percentage</label>
              <span className={styles.helper}>Auto-calculates the custom price</span>
            </div>
            <input 
              type="number" 
              step="0.01" 
              className={styles.input} 
              value={formData.discountPercentage} 
              onChange={e => handleDiscountChange(Number(e.target.value))} 
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Start Date</label>
              <span className={styles.helper}>Leave empty to apply indefinitely.</span>
            </div>
            <input 
              type="date" 
              name="startDate" 
              className={styles.input} 
              value={formData.startDate} 
              onChange={handleChange} 
            />
          </div>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>End Date</label>
              <span className={styles.helper}>Expiration of this pricing rule.</span>
            </div>
            <input 
              type="date" 
              name="endDate" 
              className={styles.input} 
              value={formData.endDate} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Start Time</label>
              <span className={styles.helper}>e.g. 14:00 (24-hour format)</span>
            </div>
            <input 
              type="time" 
              name="startTime" 
              className={styles.input} 
              value={formData.startTime} 
              onChange={handleChange} 
            />
          </div>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>End Time</label>
              <span className={styles.helper}>e.g. 18:00 (24-hour format)</span>
            </div>
            <input 
              type="time" 
              name="endTime" 
              className={styles.input} 
              value={formData.endTime} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Apply on Days</label>
            <span className={styles.helper}>Select specific days or leave empty to apply every day.</span>
          </div>
          <div className={styles.daysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
              <button 
                key={day} 
                type="button"
                className={`${styles.dayBtn} ${formData.daysOfWeek.includes(idx) ? styles.dayBtnActive : ''}`}
                onClick={() => toggleDay(idx)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Processing...' : submitLabel}
        </button>
      </div>
    </form>
  );
}