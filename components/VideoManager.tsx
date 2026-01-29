"use client";

import React from 'react';
import { Plus, Trash2, Video, Youtube, Link as LinkIcon } from 'lucide-react';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {videos.map((video, index) => (
                <div key={index} style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    padding: '16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    background: '#fafafa',
                    alignItems: 'flex-start'
                }}>
                    {/* Thumbnail Container - Fixed Width */}
                    <div style={{ 
                        width: '120px', 
                        height: '80px', 
                        background: '#f5f5f5', 
                        borderRadius: '6px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid #e5e5e5'
                    }}>
                        {video.provider === 'youtube' && getYoutubeThumbnail(video.video_url) ? (
                            <img 
                                src={getYoutubeThumbnail(video.video_url)!} 
                                alt="Thumbnail" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} // Optional: make thumb grayscale too
                            />
                        ) : (
                            <Video size={24} color="#a3a3a3" />
                        )}
                    </div>

                    {/* Inputs Container - Flexible Width */}
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '10px',
                        minWidth: 0 // Crucial for preventing overflow in flex children
                    }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <LinkIcon size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3' }} />
                                <input 
                                    type="text" 
                                    placeholder="Paste YouTube URL here..."
                                    value={video.video_url}
                                    onChange={(e) => handleChange(index, 'video_url', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 10px 10px 34px',
                                        borderRadius: '6px',
                                        border: '1px solid #d4d4d4',
                                        fontSize: '13px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        background: '#fff',
                                        color: '#171717'
                                    }}
                                />
                            </div>
                            {/* Provider Badge - Monochrome */}
                            <div style={{ 
                                fontSize: '11px', 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                padding: '6px 10px', 
                                background: '#171717', // Monochrome black background
                                color: '#fff',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexShrink: 0,
                                height: '36px',
                                boxSizing: 'border-box'
                            }}>
                                {video.provider === 'youtube' && <Youtube size={12} fill="currentColor" />}
                                {video.provider}
                            </div>
                        </div>
                        
                        <input 
                            type="text" 
                            placeholder="Video Title (Optional - for SEO)"
                            value={video.title}
                            onChange={(e) => handleChange(index, 'title', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #d4d4d4',
                                fontSize: '13px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                background: '#fff',
                                color: '#171717'
                            }}
                        />
                    </div>

                    {/* Delete Button - Monochrome & Hover Effect */}
                    <button 
                        type="button" 
                        onClick={() => handleRemove(index)}
                        style={{
                            background: '#f5f5f5', // Light gray instead of red background
                            border: '1px solid #e5e5e5', // Gray border
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#525252', // Dark gray icon instead of red
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#e5e5e5';
                            e.currentTarget.style.color = '#171717';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = '#f5f5f5';
                            e.currentTarget.style.color = '#525252';
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}

            <button 
                type="button" 
                onClick={handleAdd}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px',
                    border: '1px dashed #d4d4d4',
                    borderRadius: '8px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#404040',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#171717';
                    e.currentTarget.style.color = '#171717';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#d4d4d4';
                    e.currentTarget.style.color = '#404040';
                }}
            >
                <Plus size={16} /> Add Video URL
            </button>
        </div>
    );
}