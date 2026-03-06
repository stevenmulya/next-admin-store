"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { ArrowLeft, Loader2, Plus, Calendar, Clock, Tag, Trash2, Layers, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { ItemPricingRuleForm, PricingRulePayload } from '@/components/ui/form/ItemPricingRuleForm';
import styles from './page.module.css';

export default function ItemPricingPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;

  const [item, setItem] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemRes, rulesRes]: any = await Promise.all([
        api.get(`/items/${itemId}`),
        api.get(`/item-pricing-rules/item/${itemId}`)
      ]);
      
      const itemData = itemRes?.data?.data || itemRes?.data;
      setItem(itemData);
      setRules(rulesRes?.data?.data || rulesRes?.data || []);
    } catch (error) {
      notifyError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitRule = async (payload: PricingRulePayload) => {
    try {
      setSubmitting(true);
      const finalPayload = {
        ...payload,
        itemId: Number(itemId),
        startDate: payload.startDate ? new Date(payload.startDate).toISOString() : undefined,
        endDate: payload.endDate ? new Date(payload.endDate).toISOString() : undefined,
      };

      await api.post('/item-pricing-rules', finalPayload);
      notifySuccess("Pricing rule added successfully");
      setShowAddForm(false);
      fetchData();
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Failed to add pricing rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this pricing rule?")) return;
    try {
      await api.delete(`/item-pricing-rules/${id}`);
      notifySuccess("Rule deleted successfully");
      fetchData();
    } catch (error) {
      notifyError("Failed to delete rule");
    }
  };

  const getVariantName = (variantId: number | null) => {
    if (!variantId || !item?.variants) return null;
    const variant = item.variants.find((v: any) => v.id === variantId);
    return variant ? variant.name : null;
  };

  const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={20} /> 
        <span>Syncing pricing rules...</span>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={18} />
          </button>
          <h1 className={styles.title}>Dynamic Pricing</h1>
        </div>
        <p className={styles.subtitle}>Configure automated rates and discounts for <strong>{item?.name?.toUpperCase()}</strong></p>
      </div>

      {item?.hasVariants && item?.variants?.length > 0 ? (
        <div className={styles.infoCard}>
          <div className={styles.basePriceLabel}>VARIANT BASE PRICES</div>
          <div className={styles.variantsPriceGrid}>
            {item.variants.map((v: any) => (
              <div key={v.id} className={styles.variantPriceItem}>
                <span className={styles.variantName}>{v.name.toUpperCase()} {v.sku ? `(${v.sku})` : ''}</span>
                <span className={styles.variantPrice}>{formatCurrency(v.price, item.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.infoCard}>
          <div className={styles.basePriceLabel}>MASTER BASE PRICE</div>
          <div className={styles.basePriceValue}>
            {formatCurrency(item?.price || 0, item?.currency)}
          </div>
        </div>
      )}

      <div className={styles.imageSection}>
        <div className={styles.dropdownHeader} onClick={() => setShowAddForm(!showAddForm)}>
          <div className={styles.titleGroup}>
            <Percent size={18} className={styles.icon} />
            <h3 className={styles.sectionTitle}>Add Pricing Rule</h3>
          </div>
          {showAddForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {showAddForm && (
          <div className={styles.dropdownContent}>
            <ItemPricingRuleForm 
              basePrice={Number(item?.price || 0)}
              variants={item?.variants || []}
              onSubmit={handleSubmitRule}
              loading={submitting}
              submitLabel="Save Rule"
              onCancel={() => setShowAddForm(false)}
              styles={styles}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: '32px' }}>
        <h3 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Active Rules Overview</h3>
        <div className={styles.rulesList}>
          {rules.length === 0 ? (
            <div className={styles.emptyState}>No custom pricing rules defined for this item.</div>
          ) : (
            rules.map((rule) => {
              const variantName = getVariantName(rule.variantId);
              
              return (
                <div key={rule.id} className={styles.ruleCard}>
                  <div className={styles.ruleInfo}>
                    <div className={styles.ruleHeader}>
                      <h3 className={styles.ruleName}>{rule.name}</h3>
                      <span className={styles.priorityBadge}>PRIO: {rule.priority}</span>
                      {rule.isPercentageRule ? 
                        <span className={styles.typeBadge}>PERCENTAGE BASED</span> : 
                        <span className={styles.typeBadge}>FIXED VALUE BASED</span>
                      }
                    </div>
                    
                    <div className={styles.ruleDetails}>
                      <div className={styles.detailItem}>
                        <Calendar size={14}/> 
                        {rule.startDate ? new Date(rule.startDate).toLocaleDateString() : 'Forever'} - {rule.endDate ? new Date(rule.endDate).toLocaleDateString() : 'Forever'}
                      </div>
                      <div className={styles.detailItem}>
                        <Clock size={14}/> 
                        {rule.startTime || '00:00'} - {rule.endTime || '23:59'}
                      </div>
                      <div className={styles.detailItem}>
                        <Tag size={14}/> 
                        {rule.daysOfWeek && rule.daysOfWeek.length > 0 
                          ? rule.daysOfWeek.map((d: number) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') 
                          : 'All Days'}
                      </div>
                      {variantName && (
                        <div className={styles.detailItem} style={{ color: 'var(--badge-pin-text)', backgroundColor: 'var(--badge-pin-bg)', padding: '2px 6px', borderRadius: '2px', fontWeight: 600 }}>
                          <Layers size={14} />
                          {variantName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.rulePrice}>
                    <div className={styles.priceValue}>
                      {formatCurrency(rule.customPrice, item?.currency)}
                    </div>
                    <div className={styles.discValue}>
                      {rule.isPercentageRule ? `-${rule.discountPercentage}%` : `Custom`}
                    </div>
                    <button onClick={() => handleDelete(rule.id)} className={styles.deleteBtn} title="Purge Rule">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}