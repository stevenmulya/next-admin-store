"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { ItemForm } from '@/components/ui/form/ItemForm';
import { ItemImageForm } from '@/components/ui/form/ItemImageForm';
import { ChevronDown, ChevronUp, ImagePlus } from 'lucide-react';
import styles from './page.module.css';

export default function AddItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleSubmit = async (itemPayload: any) => {
    try {
      setLoading(true);
      const res: any = await api.post('/items', itemPayload);
      const newItem = res?.data?.data || res?.data;

      if (!newItem || !newItem.id) throw new Error("Failed to create Item entry");

      if (images.length > 0) {
        for (const img of images) {
          if (!img.file) continue;
          const formData = new FormData();
          formData.append('file', img.file);
          formData.append('itemId', newItem.id.toString());
          formData.append('isPrimary', img.isPrimary.toString());
          await api.post('/item-images/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      notifySuccess("Item and gallery saved successfully");
      router.push('/dashboard/items');
    } catch (error: any) {
      notifyError(error.response?.data?.message || error.message || "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add New Item</h1>
        <p className={styles.subtitle}>Fill in the basic information and manage the item gallery.</p>
      </div>

      <ItemForm 
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel={loading ? "Saving All..." : "Save Item Data"} 
        onCancel={() => router.back()} 
        styles={styles}
        extraContent={
          <div className={styles.imageSection}>
            <div className={styles.dropdownHeader} onClick={() => setShowImageUpload(!showImageUpload)}>
              <div className={styles.titleGroup}>
                <ImagePlus size={20} className={styles.icon} />
                <h3 className={styles.sectionTitle}>Add Item Images</h3>
                <span className={styles.optionalBadge}>(Optional)</span>
              </div>
              {showImageUpload ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {showImageUpload && (
              <div className={styles.dropdownContent}>
                <ItemImageForm images={images} onChange={setImages} />
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}