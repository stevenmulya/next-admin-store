"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { UserForm } from '@/components/ui/form/UserForm';
import styles from './page.module.css';

interface UserData {
  name: string;
  email: string;
  role: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userData, setUserData] = useState<UserData | undefined>(undefined);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setFetching(true);
        const res: any = await api.get(`/users/${userId}`);
        const data = res?.data?.data || res?.data || res;
        
        setUserData({
          name: data.name,
          email: data.email,
          role: data.role
        });
      } catch (error) {
        notifyError("User not found");
        router.push('/dashboard/users');
      } finally {
        setFetching(false);
      }
    };

    if (userId) fetchUserData();
  }, [userId, router]);

  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      await api.patch(`/users/${userId}`, payload);
      notifySuccess("User updated successfully");
      router.push('/dashboard/users');
      router.refresh();
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit User</h1>
        <p className={styles.subtitle}>Update account details and change user permissions.</p>
      </div>
      
      <UserForm 
        initialData={userData}
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel="Update Account" 
        onCancel={() => router.back()} 
      />
    </div>
  );
}