"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { ItemForm } from '@/components/ui/form/ItemForm';
import { ItemImageForm } from '@/components/ui/form/ItemImageForm';
import { ChevronDown, ChevronUp, ImagePlus, Loader2 } from 'lucide-react';
import styles from '../../add/page.module.css';

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemData, setItemData] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [showImageUpload, setShowImageUpload] = useState(true);

  useEffect(() => {
    if (!itemId) return;

    const fetchItem = async () => {
      try {
        const res: any = await api.get(`/items/${itemId}`);
        const data = res?.data?.data || res?.data;
        setItemData(data);
        
        if (data.images) {
          setImages(data.images.map((img: any) => ({
            id: img.id,
            preview: img.url,
            isPrimary: img.isPrimary,
            isExisting: true
          })));
        }
      } catch (error) {
        notifyError("Failed to fetch item details");
        router.push('/dashboard/items');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId, router]);

  const handleSubmit = async (itemPayload: any) => {
    if (!itemId) return;

    try {
      setSubmitting(true);
      await api.patch(`/items/${itemId}`, itemPayload);

      const newImages = images.filter(img => !img.isExisting);
      if (newImages.length > 0) {
        for (const img of newImages) {
          if (!img.file) continue;
          const formData = new FormData();
          formData.append('file', img.file);
          formData.append('itemId', itemId);
          formData.append('isPrimary', img.isPrimary.toString());
          
          await api.post('/item-images/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      notifySuccess("Item updated successfully");
      router.push('/dashboard/items');
    } catch (error: any) {
      notifyError(error.response?.data?.message || "Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" />
        <span>Loading item data...</span>
      </div>
    );
  }

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Item</h1>
        <p className={styles.subtitle}>Update item information and manage the gallery for #{itemId}</p>
      </div>

      <ItemForm 
        initialData={itemData}
        onSubmit={handleSubmit} 
        loading={submitting} 
        submitLabel={submitting ? "Updating..." : "Update Item Data"} 
        onCancel={() => router.back()} 
        styles={styles}
        extraContent={
          <div className={styles.imageSection}>
            <div className={styles.dropdownHeader} onClick={() => setShowImageUpload(!showImageUpload)}>
              <div className={styles.titleGroup}>
                <ImagePlus size={20} className={styles.icon} />
                <h3 className={styles.sectionTitle}>Manage Item Images</h3>
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