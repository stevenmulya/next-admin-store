"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DataTable.module.css';

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
  pagination?: {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable({ headers, children, pagination }: DataTableProps) {
  return (
    <div className={`${styles.wrapper} reveal-line`}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className={styles.pagination}>
          <p className={styles.pageInfo}>
            PAGE {pagination.currentPage} OF {pagination.lastPage}
          </p>
          <div className={styles.pageActions}>
            <button 
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className={styles.pageBtn}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={pagination.currentPage === pagination.lastPage}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className={styles.pageBtn}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}