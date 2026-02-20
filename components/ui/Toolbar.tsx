"use client";

import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
  }[];
  sortOptions?: { label: string; value: string }[];
  onSortChange?: (value: string) => void;
}

export function Toolbar({ 
  searchPlaceholder = "Search...", 
  searchValue, 
  onSearchChange, 
  filters,
  sortOptions,
  onSortChange 
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      {/* SEARCH SECTION */}
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.icon} />
        <input 
          type="text" 
          placeholder={searchPlaceholder} 
          className={styles.input}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* FILTER & SORT SECTION */}
      <div className={styles.controls}>
        {filters?.map((filter, index) => (
          <div key={index} className={styles.selectWrapper}>
            <Filter size={14} className={styles.icon} />
            <select 
              className={styles.select}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
            >
              <option value="ALL">{filter.label}</option>
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}

        {sortOptions && (
          <div className={styles.selectWrapper}>
            <ArrowUpDown size={14} className={styles.icon} />
            <select 
              className={styles.select}
              onChange={(e) => onSortChange?.(e.target.value)}
            >
              <option value="">SORT BY</option>
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}