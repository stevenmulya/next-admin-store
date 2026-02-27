"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { ItemForm, ItemPayload } from '@/components/ui/form/ItemForm';
import { ItemImageForm } from '@/components/ui/form/ItemImageForm';
import { ItemVideoForm } from '@/components/ui/form/ItemVideoForm';
import { ItemDefaultPriceForm } from '@/components/ui/form/ItemDefaultPriceForm';
import { ItemVariantInputGroup, ItemVariantPayload } from '@/components/ui/form/ItemVariantInputGroup';
import { ChevronDown, ChevronUp, ImagePlus, Video, Banknote, Layers } from 'lucide-react';
import styles from './page.module.css';

export interface ImageUpload {
  file?: File;
  isPrimary?: boolean;
}

export interface VideoUpload {
  url: string;
  provider: string;
}

export interface PriceData {
  basePrice: number;
  currency: string;
}

export default function AddItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [videos, setVideos] = useState<VideoUpload[]>([]);
  const [variants, setVariants] = useState<ItemVariantPayload[]>([]);
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  const [showImageUpload, setShowImageUpload] = useState<boolean>(false);
  const [showVideoUpload, setShowVideoUpload] = useState<boolean>(false);
  const [showPriceForm, setShowPriceForm] = useState<boolean>(false);
  const [showVariantForm, setShowVariantForm] = useState<boolean>(false);

  const handleSubmit = async (itemPayload: ItemPayload) => {
    try {
      setLoading(true);

      const payload = {
        ...itemPayload,
        basePrice: priceData?.basePrice || 0,
        currency: priceData?.currency || 'IDR',
        variants: variants.length > 0 ? variants : undefined,
        videos: videos.length > 0 ? videos : undefined,
      };

      const res = await api.post('/items', payload);
      const createdItem = res.data?.data || res.data;
      const itemId = createdItem.id;

      if (images.length > 0) {
        const formData = new FormData();
        let primaryIdx = -1;
        
        images.forEach((img, index) => {
          if (img.file) {
            formData.append('files', img.file);
            if (img.isPrimary) primaryIdx = index;
          }
        });

        formData.append('itemId', itemId.toString());
        formData.append('primaryIndex', primaryIdx.toString());

        await api.post('/item-images/bulk-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      notifySuccess("Item and media saved successfully");
      router.push('/dashboard/items');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "An error occurred";
      notifyError(new Error(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add New Item</h1>
        <p className={styles.subtitle}>Define item details, inventory, and media in one place.</p>
      </div>

      <ItemForm 
        onSubmit={handleSubmit} 
        loading={loading} 
        submitLabel={loading ? "Saving..." : "Save Item"} 
        onCancel={() => router.back()} 
        styles={styles}
        extraContent={
          <>
            <div className={styles.imageSection}>
              <div className={styles.dropdownHeader} onClick={() => setShowPriceForm(!showPriceForm)}>
                <div className={styles.titleGroup}>
                  <Banknote size={18} className={styles.icon} />
                  <h3 className={styles.sectionTitle}>Price & Inventory</h3>
                  <span className={styles.optionalBadge}>Required</span>
                </div>
                {showPriceForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {showPriceForm && (
                <div className={styles.dropdownContent}>
                  <ItemDefaultPriceForm onChange={setPriceData} styles={styles} />
                </div>
              )}
            </div>

            <div className={styles.imageSection}>
              <div className={styles.dropdownHeader} onClick={() => setShowVariantForm(!showVariantForm)}>
                <div className={styles.titleGroup}>
                  <Layers size={18} className={styles.icon} />
                  <h3 className={styles.sectionTitle}>Item Variants</h3>
                  <span className={styles.optionalBadge}>Optional</span>
                </div>
                {showVariantForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {showVariantForm && (
                <div className={styles.dropdownContent}>
                  <ItemVariantInputGroup variants={variants} onChange={setVariants} styles={styles} />
                </div>
              )}
            </div>

            <div className={styles.imageSection}>
              <div className={styles.dropdownHeader} onClick={() => setShowImageUpload(!showImageUpload)}>
                <div className={styles.titleGroup}>
                  <ImagePlus size={18} className={styles.icon} />
                  <h3 className={styles.sectionTitle}>Item Images</h3>
                  <span className={styles.optionalBadge}>Optional</span>
                </div>
                {showImageUpload ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {showImageUpload && (
                <div className={styles.dropdownContent}>
                  <ItemImageForm images={images} onChange={setImages} />
                </div>
              )}
            </div>

            <div className={styles.imageSection}>
              <div className={styles.dropdownHeader} onClick={() => setShowVideoUpload(!showVideoUpload)}>
                <div className={styles.titleGroup}>
                  <Video size={18} className={styles.icon} />
                  <h3 className={styles.sectionTitle}>Item Videos</h3>
                  <span className={styles.optionalBadge}>Optional</span>
                </div>
                {showVideoUpload ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              {showVideoUpload && (
                <div className={styles.dropdownContent}>
                  <ItemVideoForm videos={videos} onChange={setVideos} />
                </div>
              )}
            </div>
          </>
        }
      />
    </div>
  );
}