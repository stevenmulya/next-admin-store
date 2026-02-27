"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { CategoryForm } from '@/components/ui/form/itemCategoryForm';
import styles from './page.module.css';

export default function AddCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (payload: any) => {
    try {
      setLoading(true);
      const finalPayload = { ...payload, parentId: null };
      
      await api.post('/item-categories', finalPayload);
      notifySuccess("Category saved successfully");
      router.push('/dashboard/categories');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to save category";
      notifyError(new Error(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add New Category</h1>
        <p className={styles.subtitle}>Define category details, subcategories, and required attributes.</p>
      </div>

      <CategoryForm 
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Save Category"
        onCancel={() => router.back()}
        styles={styles} 
      />
    </div>
  );
}