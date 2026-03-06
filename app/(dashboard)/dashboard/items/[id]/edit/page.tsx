"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { ItemForm, ItemPayload } from '@/components/ui/form/ItemForm';
import { ItemImageForm } from '@/components/ui/form/ItemImageForm';
import { ItemVideoForm } from '@/components/ui/form/ItemVideoForm';
import { ItemDefaultPriceForm } from '@/components/ui/form/ItemDefaultPriceForm';
import { ItemQuantityForm } from '@/components/ui/form/ItemQuantityForm';
import { ItemTagsForm } from '@/components/ui/form/ItemTagsForm';
import { ItemVariantInputGroup, ItemVariantPayload } from '@/components/ui/form/ItemVariantInputGroup';
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Video, Banknote, Layers, Package, Tags } from 'lucide-react';
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

export interface QuantityData {
  stock: number;
  lowStock: number;
}

export interface ExistingVariant extends ItemVariantPayload {
  id?: number;
}

const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children, 
  isOpen, 
  onToggle 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <div className={styles.imageSection}>
    <div className={styles.dropdownHeader} onClick={onToggle}>
      <div className={styles.titleGroup}>
        <Icon size={18} className={styles.icon} />
        <h3 className={styles.sectionTitle}>{title}</h3>
        <span className={styles.optionalBadge}>Optional</span>
      </div>
      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </div>
    {isOpen && <div className={styles.dropdownContent}>{children}</div>}
  </div>
);

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemData, setItemData] = useState<any>(null);
  
  const [itemMode, setItemMode] = useState<'SINGLE' | 'VARIANT'>('SINGLE');
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [videos, setVideos] = useState<VideoUpload[]>([]);
  const [variants, setVariants] = useState<ExistingVariant[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [quantityData, setQuantityData] = useState<QuantityData | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

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

        if (data.inventory) {
          setQuantityData({
            stock: data.inventory.stock,
            lowStock: data.inventory.lowStock
          });
        }

        if (data.variants && data.variants.length > 0) {
          const fetchedVariants = data.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price ? Number(v.price) : undefined,
            stock: v.stock,
            metadata: v.metadata,
            isExisting: true
          }));
          setVariants(fetchedVariants);
          setItemMode('VARIANT');
        } else {
          setItemMode('SINGLE');
        }

        if (data.tags) {
          const fetchedTags = data.tags.map((t: any) => typeof t === 'string' ? t : t.name);
          setTags(fetchedTags);
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
      const isVariantMode = itemMode === 'VARIANT';

      const finalPayload = {
        ...itemPayload,
        hasVariants: isVariantMode,
        basePrice: !isVariantMode ? (priceData?.basePrice ?? 0) : 0,
        currency: !isVariantMode ? (priceData?.currency ?? 'USD') : 'USD',
        stock: !isVariantMode ? (quantityData?.stock ?? 0) : 0,
        lowStock: !isVariantMode ? (quantityData?.lowStock ?? 5) : 5,
        variants: isVariantMode ? variants : [],
        videos: videos,
        tags: tags
      };

      await api.patch(`/items/${itemId}`, finalPayload);

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

      notifySuccess("Item updated successfully");
      router.push('/dashboard/items');
    } catch (error: unknown) {
      const errorMsg = (error as any).response?.data?.message || "Failed to update item";
      notifyError(new Error(errorMsg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '40px', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={20} />
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
            <div className={styles.modeToggle}>
              <button 
                type="button" 
                className={`${styles.modeBtn} ${itemMode === 'SINGLE' ? styles.modeBtnActive : ''}`}
                onClick={() => setItemMode('SINGLE')}
              >
                Single Item
              </button>
              <button 
                type="button" 
                className={`${styles.modeBtn} ${itemMode === 'VARIANT' ? styles.modeBtnActive : ''}`}
                onClick={() => setItemMode('VARIANT')}
              >
                Item with Variants
              </button>
            </div>

            {itemMode === 'SINGLE' && (
              <>
                <CollapsibleSection 
                  title="Item Price" 
                  icon={Banknote} 
                  isOpen={openSection === 'price'} 
                  onToggle={() => toggleSection('price')}
                >
                  <ItemDefaultPriceForm 
                    initialData={priceData} 
                    onChange={setPriceData} 
                    styles={styles} 
                  />
                </CollapsibleSection>

                <CollapsibleSection 
                  title="Item Inventory" 
                  icon={Package} 
                  isOpen={openSection === 'inventory'} 
                  onToggle={() => toggleSection('inventory')}
                >
                  <ItemQuantityForm 
                    initialData={quantityData}
                    onChange={setQuantityData} 
                    styles={styles} 
                  />
                </CollapsibleSection>
              </>
            )}

            {itemMode === 'VARIANT' && (
              <CollapsibleSection 
                title="Item Variants" 
                icon={Layers} 
                isOpen={openSection === 'variants'} 
                onToggle={() => toggleSection('variants')}
              >
                <ItemVariantInputGroup variants={variants} onChange={setVariants} styles={styles} />
              </CollapsibleSection>
            )}

            <CollapsibleSection 
              title="Item Tags" 
              icon={Tags} 
              isOpen={openSection === 'tags'} 
              onToggle={() => toggleSection('tags')}
            >
              <ItemTagsForm 
                initialData={tags} 
                onChange={setTags} 
                styles={styles} 
              />
            </CollapsibleSection>

            <CollapsibleSection 
              title="Item Images" 
              icon={ImagePlus} 
              isOpen={openSection === 'images'} 
              onToggle={() => toggleSection('images')}
            >
              <ItemImageForm images={images} onChange={setImages} />
            </CollapsibleSection>

            <CollapsibleSection 
              title="Item Videos" 
              icon={Video} 
              isOpen={openSection === 'videos'} 
              onToggle={() => toggleSection('videos')}
            >
              <ItemVideoForm videos={videos} onChange={setVideos} />
            </CollapsibleSection>
          </>
        }
      />
    </div>
  );
}