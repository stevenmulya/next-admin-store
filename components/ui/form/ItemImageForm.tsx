"use client";

import React, { useRef } from 'react';
import { ImagePlus, X, Star } from 'lucide-react';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import styles from './ItemImageForm.module.css';

interface ItemImageFormProps {
  images: any[];
  onChange: (images: any[]) => void;
}

export function ItemImageForm({ images, onChange }: ItemImageFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        isPrimary: images.length === 0,
        isExisting: false,
      }));
      onChange([...images, ...newFiles]);
    }
  };

  const removeImage = async (index: number) => {
    const targetImage = images[index];

    if (targetImage.isExisting) {
      const confirmDelete = confirm("Are you sure you want to delete this image from the server?");
      if (!confirmDelete) return;

      try {
        await api.delete(`/item-images/${targetImage.id}`);
        notifySuccess("Image deleted from server");
      } catch (error) {
        notifyError("Failed to delete image from server");
        return;
      }
    }

    const updated = images.filter((_, i) => i !== index);
    if (targetImage.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const setPrimary = async (index: number) => {
    const targetImage = images[index];

    if (targetImage.isExisting) {
      try {
        await api.patch(`/item-images/${targetImage.id}`, { isPrimary: true });
      } catch (error) {
        notifyError("Failed to update primary image");
        return;
      }
    }

    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {images.map((img, index) => (
          <div key={index} className={`${styles.card} ${img.isPrimary ? styles.primaryCard : ''}`}>
            <img src={img.preview} alt="Preview" className={styles.image} />
            
            <button type="button" className={styles.removeBtn} onClick={() => removeImage(index)}>
              <X size={14} />
            </button>

            <button 
              type="button"
              className={`${styles.starBtn} ${img.isPrimary ? styles.starActive : ''}`} 
              onClick={() => setPrimary(index)}
            >
              <Star size={14} fill={img.isPrimary ? "currentColor" : "none"} />
            </button>

            {img.isPrimary && <div className={styles.badge}>PRIMARY</div>}
          </div>
        ))}

        <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
          <ImagePlus size={20} />
          <span className={styles.uploadText}>Add Image</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            multiple 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>
      </div>
    </div>
  );
}