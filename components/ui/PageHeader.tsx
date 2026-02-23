"use client";

import React from 'react';
import { Plus } from 'lucide-react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageHeader({ title, description, actionLabel, onAction }: PageHeaderProps) {
  return (
    <div className={styles.container}>
      <div className={styles.textGroup}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      
      {actionLabel && onAction && (
        <button className={styles.actionBtn} onClick={onAction}>
          <Plus size={14} strokeWidth={3} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}