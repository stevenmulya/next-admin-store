"use client";

import React from 'react';
import { Plus, Trash2, Video, Youtube, Link as LinkIcon } from 'lucide-react';
import styles from './VideoManager.module.css';

interface VideoItem {
    video_url: string;
    title: string;
    provider: string;
}

interface VideoManagerProps {
    videos: VideoItem[];
    onChange: (videos: VideoItem[]) => void;
}

export default function VideoManager({ videos, onChange }: VideoManagerProps) {
    
    const getProvider = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('vimeo.com')) return 'vimeo';
        return 'external';
    };

    const handleAdd = () => {
        onChange([...videos, { video_url: '', title: '', provider: 'youtube' }]);
    };

    const handleRemove = (index: number) => {
        const newVideos = [...videos];
        newVideos.splice(index, 1);
        onChange(newVideos);
    };

    const handleChange = (index: number, field: keyof VideoItem, value: string) => {
        const newVideos = [...videos];
        newVideos[index] = { ...newVideos[index], [field]: value };
        
        if (field === 'video_url') {
            newVideos[index].provider = getProvider(value);
        }
        
        onChange(newVideos);
    };

    const getYoutubeThumbnail = (url: string) => {
        try {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) 
                ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`
                : null;
        } catch (e) {
            return null;
        }
    };

    return (
        <div className={styles.container}>
            {videos.map((video, index) => (
                <div key={index} className={styles.videoRow}>
                    <div className={styles.thumbnailContainer}>
                        {video.provider === 'youtube' && getYoutubeThumbnail(video.video_url) ? (
                            <img 
                                src={getYoutubeThumbnail(video.video_url)!} 
                                alt="Thumbnail" 
                                className={styles.thumbnailImg}
                            />
                        ) : (
                            <Video size={24} className={styles.placeholderIcon} />
                        )}
                    </div>

                    <div className={styles.inputContainer}>
                        <div className={styles.urlRow}>
                            <div className={styles.inputWrapper}>
                                <LinkIcon size={14} className={styles.linkIcon} />
                                <input 
                                    type="text" 
                                    placeholder="Paste YouTube URL here..."
                                    value={video.video_url}
                                    onChange={(e) => handleChange(index, 'video_url', e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.providerBadge}>
                                {video.provider === 'youtube' && <Youtube size={12} fill="currentColor" />}
                                {video.provider}
                            </div>
                        </div>
                        
                        <input 
                            type="text" 
                            placeholder="Video Title (Optional - for SEO)"
                            value={video.title}
                            onChange={(e) => handleChange(index, 'title', e.target.value)}
                            className={styles.inputTitle}
                        />
                    </div>

                    <button 
                        type="button" 
                        onClick={() => handleRemove(index)}
                        className={styles.deleteBtn}
                        title="Remove Video"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}

            <button 
                type="button" 
                onClick={handleAdd}
                className={styles.addBtn}
            >
                <Plus size={16} /> Add Video URL
            </button>
        </div>
    );
}