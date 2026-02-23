"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { SubCategoryForm } from '@/components/ui/form/SubCategoryForm';
import styles from '../../add/page.module.css';

function AddSubCategoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId');
  const [loading, setLoading] = useState(false);

  if (!parentId) {
    router.push('/dashboard/categories');
    return null;
  }

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/item-categories', data);
      notifySuccess("New subcategory has been added");
      router.push('/dashboard/categories');
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Failed to add subcategory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add New Subcategory</h1>
        <p className={styles.subtitle}>Create a new sub-level category to better organize your items.</p>
      </div>
      
      <SubCategoryForm 
        parentId={parentId} 
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel="Add Subcategory"
        onCancel={() => router.back()} 
      />
    </div>
  );
}

export default function AddSubCategoryPage() {
  return (
    <Suspense fallback={<div className={styles.wrapper}>Loading subcategory form...</div>}>
      <AddSubCategoryContent />
    </Suspense>
  );
}