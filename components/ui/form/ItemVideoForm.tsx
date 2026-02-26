"use client";

import React, { useState } from 'react';
import { Video, X, Plus } from 'lucide-react';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import styles from './ItemVideoForm.module.css';

interface ItemVideoFormProps {
  videos: any[];
  onChange: (videos: any[]) => void;
}

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export function ItemVideoForm({ videos, onChange }: ItemVideoFormProps) {
  const [newUrl, setNewUrl] = useState('');

  const handleAddVideo = () => {
    if (!newUrl.trim()) return;

    let provider = 'other';
    if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
      provider = 'youtube';
    }

    const newVideo = {
      url: newUrl.trim(),
      provider,
      isExisting: false,
    };

    onChange([...videos, newVideo]);
    setNewUrl('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddVideo();
    }
  };

  const removeVideo = async (index: number) => {
    const targetVideo = videos[index];

    if (targetVideo.isExisting) {
      const confirmDelete = confirm("Are you sure you want to delete this video from the server?");
      if (!confirmDelete) return;

      try {
        await api.delete(`/item-videos/${targetVideo.id}`);
        notifySuccess("Video deleted from server");
      } catch (error) {
        notifyError("Failed to delete video from server");
        return;
      }
    }

    const updated = videos.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <input
          type="url"
          placeholder="Paste video URL here (e.g. YouTube link)"
          className={styles.input}
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className={styles.addBtn} onClick={handleAddVideo}>
          <Plus size={18} />
          <span>Add Video</span>
        </button>
      </div>

      <div className={styles.grid}>
        {videos.map((vid, index) => {
          const ytId = getYouTubeId(vid.url);
          const thumbnailUrl = ytId 
            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` 
            : null;

          return (
            <div key={index} className={styles.card}>
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Video Thumbnail" className={styles.thumbnail} />
              ) : (
                <div className={styles.placeholder}>
                  <Video size={32} />
                  <span className={styles.providerBadge}>{vid.provider}</span>
                </div>
              )}
              
              <div className={styles.urlOverlay}>
                <span className={styles.urlText}>{vid.url}</span>
              </div>
              
              <button type="button" className={styles.removeBtn} onClick={() => removeVideo(index)}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}