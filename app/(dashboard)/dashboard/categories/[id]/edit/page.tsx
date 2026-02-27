"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { CategoryForm } from '@/components/ui/form/itemCategoryForm';
import styles from './page.module.css';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [initialData, setInitialData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await api.get(`/item-categories/${id}`);
        setInitialData(response.data);
      } catch (error: any) {
        notifyError(new Error("Failed to load category data"));
        router.push('/dashboard/categories');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCategory();
    }
  }, [id, router]);

  const handleSubmit = async (payload: any) => {
    try {
      setIsSubmitting(true);
      await api.patch(`/item-categories/${id}`, payload);
      notifySuccess("Category updated successfully");
      router.push('/dashboard/categories');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to update category";
      notifyError(new Error(errorMsg));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className={styles.wrapper}>Loading...</div>;
  }

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Category</h1>
        <p className={styles.subtitle}>Update category details, subcategories, and required attributes.</p>
      </div>

      <CategoryForm 
        initialData={initialData}
        onSubmit={handleSubmit}
        loading={isSubmitting}
        submitLabel="Update Category"
        onCancel={() => router.back()}
        styles={styles} 
      />
    </div>
  );
}