"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { CategoryForm } from '@/components/ui/form/CategoryForm';
import styles from './page.module.css';

function AddCategoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/item-categories', data);
      notifySuccess(parentId ? "Sub-category linked successfully" : "Root category created successfully");
      router.push('/dashboard/categories');
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>{parentId ? 'Add Sub-category' : 'Add New Category'}</h1>
        <p className={styles.subtitle}>
          {parentId 
            ? 'Extend the current architecture by adding a child node.' 
            : 'Initialize a primary classification node for your item registry.'}
        </p>
      </div>
      <CategoryForm 
        parentIdFromUrl={parentId}
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel={parentId ? "Link Sub-category" : "Create Category"} 
        onCancel={() => router.back()} 
      />
    </div>
  );
}

export default function AddCategoryPage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <AddCategoryContent />
    </Suspense>
  );
}