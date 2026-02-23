"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { SubCategoryForm } from '@/components/ui/form/SubCategoryForm';
import styles from '../../../add/page.module.css';

export default function EditSubCategoryPage() {
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
        notifyError("Subcategory not found");
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
      notifySuccess("Subcategory updated successfully");
      router.push('/dashboard/categories');
      router.refresh();
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Failed to update subcategory");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading subcategory data...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Subcategory</h1>
        <p className={styles.subtitle}>Modify the properties of this child node.</p>
      </div>
      
      <SubCategoryForm 
        initialData={categoryData}
        parentId={categoryData?.parentId}
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel="Update Subcategory" 
        onCancel={() => router.back()} 
      />
    </div>
  );
}