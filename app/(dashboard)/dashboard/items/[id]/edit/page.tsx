"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { ItemForm, ItemPayload } from '@/components/ui/form/ItemForm';
import { ItemImageForm } from '@/components/ui/form/ItemImageForm';
import { ItemVideoForm } from '@/components/ui/form/ItemVideoForm';
import { ItemDefaultPriceForm } from '@/components/ui/form/ItemDefaultPriceForm';
import { ItemVariantInputGroup, ItemVariantPayload } from '@/components/ui/form/ItemVariantInputGroup';
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Video, Banknote, Layers } from 'lucide-react';
import styles from '../../add/page.module.css';

export interface ImageUpload {
  id?: number;
  file?: File;
  preview?: string;
  isPrimary?: boolean;
  isExisting?: boolean;
}

export interface VideoUpload {
  id?: number;
  url: string;
  provider: string;
  isExisting?: boolean;
}

export interface PriceData {
  basePrice: number;
  currency: string;
}

export interface ExistingVariant extends ItemVariantPayload {
  id?: number;
}

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemData, setItemData] = useState<any>(null);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [videos, setVideos] = useState<VideoUpload[]>([]);
  const [variants, setVariants] = useState<ExistingVariant[]>([]);
  const [initialVariants, setInitialVariants] = useState<ExistingVariant[]>([]);
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);

  useEffect(() => {
    if (!itemId) return;

    const fetchItem = async () => {
      try {
        const res: any = await api.get(`/items/${itemId}`);
        const data = res?.data?.data || res?.data;
        setItemData(data);
        
        if (data.defaultPrice) {
          setPriceData({
            basePrice: data.defaultPrice.basePrice,
            currency: data.defaultPrice.currency
          });
        }

        if (data.variants) {
          const fetchedVariants = data.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price ? Number(v.price) : undefined,
            stock: v.stock,
            metadata: v.metadata
          }));
          setVariants(fetchedVariants);
          setInitialVariants(fetchedVariants);
        }

        if (data.images) {
          setImages(data.images.map((img: any) => ({
            id: img.id,
            preview: img.url,
            isPrimary: img.isPrimary,
            isExisting: true
          })));
        }

        if (data.videos) {
          setVideos(data.videos.map((vid: any) => ({
            id: vid.id,
            url: vid.url,
            provider: vid.provider,
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

  const handleSubmit = async (itemPayload: ItemPayload) => {
    if (!itemId) return;

    try {
      setSubmitting(true);

      const finalPayload = {
        ...itemPayload,
        basePrice: priceData?.basePrice || 0,
        currency: priceData?.currency || 'USD'
      };

      await api.patch(`/items/${itemId}`, finalPayload);

      const currentVariantIds = variants.map(v => v.id).filter(Boolean);
      const variantsToDelete = initialVariants.filter(v => !currentVariantIds.includes(v.id));

      if (variantsToDelete.length > 0) {
        const deletePromises = variantsToDelete.map(v => api.delete(`/item-variants/${v.id}`));
        await Promise.all(deletePromises);
      }

      if (variants.length > 0) {
        const variantPromises = variants.map(v => {
          if (v.id) {
            return api.patch(`/item-variants/${v.id}`, {
              name: v.name,
              sku: v.sku || null,
              price: v.price ?? null,
              stock: v.stock,
              metadata: v.metadata
            });
          } else {
            return api.post('/item-variants', {
              ...v,
              itemId: Number(itemId)
            });
          }
        });
        await Promise.all(variantPromises);
      }

      const newImages = images.filter(img => !img.isExisting);
      if (newImages.length > 0) {
        const formData = new FormData();
        let primaryIdx = -1;

        newImages.forEach((img, index) => {
          if (img.file) {
            formData.append('files', img.file);
            if (img.isPrimary) primaryIdx = index;
          }
        });

        formData.append('itemId', itemId);
        formData.append('primaryIndex', primaryIdx.toString());

        await api.post('/item-images/bulk-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const newVideos = videos.filter(vid => !vid.isExisting);
      if (newVideos.length > 0) {
        const videoPromises = newVideos
          .filter(vid => vid.url)
          .map(vid => api.post('/item-videos', {
            itemId: Number(itemId),
            url: vid.url,
            provider: vid.provider,
          }));
        
        await Promise.all(videoPromises);
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
        <p className={styles.subtitle}>Update item information and manage variants & media for #{itemId}</p>
      </div>

      <ItemForm 
        initialData={itemData}
        onSubmit={handleSubmit} 
        loading={submitting} 
        submitLabel={submitting ? "Updating..." : "Update Item Data"} 
        onCancel={() => router.back()} 
        styles={styles}
        extraContent={
          <>
            <div className={styles.imageSection}>
              <div className={styles.dropdownHeader} onClick={() => setShowPriceForm(!showPriceForm)}>
                <div className={styles.titleGroup}>
                  <Banknote size={20} className={styles.icon} />
                  <h3 className={styles.sectionTitle}>Price Configuration</h3>
                </div>
                {showPriceForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              {showPriceForm && (
                <div className={styles.dropdownContent}>
                  <ItemDefaultPriceForm 
                    initialData={priceData} 
                    onChange={setPriceData} 
                    styles={styles} 
                  />
                </div>
              )}
            </div>

            <div className={styles.imageSection}>
              <div className={styles.dropdownHeader} onClick={() => setShowVariantForm(!showVariantForm)}>
                <div className={styles.titleGroup}>
                  <Layers size={20} className={styles.icon} />
                  <h3 className={styles.sectionTitle}>Manage Item Variants</h3>
                </div>
                {showVariantForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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

            <div className={styles.imageSection}>
              <div className={styles.dropdownHeader} onClick={() => setShowVideoUpload(!showVideoUpload)}>
                <div className={styles.titleGroup}>
                  <Video size={20} className={styles.icon} />
                  <h3 className={styles.sectionTitle}>Manage Item Videos</h3>
                </div>
                {showVideoUpload ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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