"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { CategoryForm } from '@/components/ui/form/CategoryForm';
import styles from '../../add/page.module.css';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categoryData, setCategoryData] = useState<any>(undefined);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setFetching(true);
        const res: any = await api.get(`/item-categories/${id}`);
        const data = res?.data?.data || res?.data || res;
        
        setCategoryData(data);
      } catch (error) {
        notifyError("Category not found");
        router.push('/dashboard/categories');
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchCategory();
  }, [id, router]);

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      await api.patch(`/item-categories/${id}`, formData);
      notifySuccess("Category updated successfully");
      router.push('/dashboard/categories');
      router.refresh();
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading category data...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Category</h1>
        <p className={styles.subtitle}>Update properties and classification details.</p>
      </div>
      
      <CategoryForm 
        initialData={categoryData}
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel="Update Category" 
        onCancel={() => router.back()} 
      />
    </div>
  );
}