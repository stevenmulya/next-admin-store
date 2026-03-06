"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { ItemForm, ItemPayload } from '@/components/ui/form/ItemForm';
import { ItemImageForm } from '@/components/ui/form/ItemImageForm';
import { ItemVideoForm } from '@/components/ui/form/ItemVideoForm';
import { ItemDefaultPriceForm } from '@/components/ui/form/ItemDefaultPriceForm';
import { ItemQuantityForm } from '@/components/ui/form/ItemQuantityForm';
import { ItemTagsForm } from '@/components/ui/form/ItemTagsForm';
import { ItemVariantInputGroup, ItemVariantPayload } from '@/components/ui/form/ItemVariantInputGroup';
import { ChevronDown, ChevronUp, ImagePlus, Video, Banknote, Layers, Package, Tags } from 'lucide-react';
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

export interface QuantityData {
  stock: number;
  lowStock: number;
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

export default function AddItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  
  // Toggle State untuk Mode Item
  const [itemMode, setItemMode] = useState<'SINGLE' | 'VARIANT'>('SINGLE');

  const [images, setImages] = useState<ImageUpload[]>([]);
  const [videos, setVideos] = useState<VideoUpload[]>([]);
  const [variants, setVariants] = useState<ItemVariantPayload[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [quantityData, setQuantityData] = useState<QuantityData | null>(null);

  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleSubmit = async (itemPayload: ItemPayload) => {
    try {
      setLoading(true);

      const isVariantMode = itemMode === 'VARIANT';

      const payload = {
        ...itemPayload,
        hasVariants: isVariantMode,
        basePrice: !isVariantMode ? (priceData?.basePrice ?? 0) : 0,
        currency: !isVariantMode ? (priceData?.currency ?? 'USD') : 'USD',
        stock: !isVariantMode ? (quantityData?.stock ?? 0) : 0,
        lowStock: !isVariantMode ? (quantityData?.lowStock ?? 5) : 5,
        variants: isVariantMode && variants.length > 0 ? variants : undefined,
        videos: videos.length > 0 ? videos : undefined,
        tags: tags.length > 0 ? tags : undefined,
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
    } catch (error: unknown) {
      const errorMsg = (error as any).response?.data?.message || "An error occurred";
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
                  <ItemDefaultPriceForm onChange={setPriceData} styles={styles} />
                </CollapsibleSection>

                <CollapsibleSection 
                  title="Item Inventory" 
                  icon={Package} 
                  isOpen={openSection === 'inventory'} 
                  onToggle={() => toggleSection('inventory')}
                >
                  <ItemQuantityForm onChange={setQuantityData} styles={styles} />
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
              <ItemTagsForm onChange={setTags} styles={styles} />
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