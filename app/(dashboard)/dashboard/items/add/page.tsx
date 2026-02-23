"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { ItemForm } from '@/components/ui/form/ItemForm';
import styles from './page.module.css';

export default function AddItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/items', data);
      notifySuccess("New registry entry created successfully");
      router.push('/dashboard/items');
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Failed to add item to registry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add New Item</h1>
        <p className={styles.subtitle}>Register a new product in the system catalog and define its primary attributes.</p>
      </div>
      <ItemForm 
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel="Register Item" 
        onCancel={() => router.back()} 
      />
    </div>
  );
}