"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { UserForm } from '@/components/ui/UserForm';
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
        notifyError("Personnel record not found");
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
      notifySuccess("Personnel record updated");
      router.push('/dashboard/users');
      router.refresh();
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>RETRIEVING_DATA...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Update Personnel</h1>
        <p className={styles.subtitle}>Modify existing user credentials and access levels.</p>
      </div>
      
      <UserForm 
        initialData={userData}
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel="Save Changes" 
        onCancel={() => router.back()} 
      />
    </div>
  );
}