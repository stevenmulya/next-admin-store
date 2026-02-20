"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { UserForm } from '@/components/ui/UserForm';
import styles from './page.module.css';

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/users/create', data);
      notifySuccess("Access provisioned successfully");
      router.push('/dashboard/users');
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Initialize Personnel</h1>
        <p className={styles.subtitle}>Define user credentials for the directory.</p>
      </div>
      <UserForm 
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel="Authorize User" 
        onCancel={() => router.back()} 
      />
    </div>
  );
}