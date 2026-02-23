"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Toolbar } from '@/components/ui/Toolbar';
import { PageHeader } from '@/components/ui/PageHeader';
import styles from './page.module.css';

export default function ItemListPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    lastPage: 1,
    total: 0
  });

  const fetchItems = useCallback(async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res: any = await api.get('/items', {
        params: {
          page: pageNumber,
          search: searchQuery || undefined,
          status: filterStatus === 'ALL' ? undefined : filterStatus
        }
      });
      
      let fetchedItems = [];
      let meta = { page: 1, lastPage: 1, total: 0 };

      const responseData = res?.data?.data || res?.data || res;
      
      if (responseData?.items) {
        fetchedItems = responseData.items;
        meta = responseData.meta || meta;
      } else if (Array.isArray(responseData)) {
        fetchedItems = responseData;
      }

      setItems(fetchedItems);
      setPagination({
        page: meta.page,
        lastPage: meta.lastPage,
        total: meta.total
      });
    } catch (error) {
      notifyError("Database synchronization failed");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchItems(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filterStatus, fetchItems]);

  const onPageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchItems(newPage);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Purge item record: ${name.toUpperCase()}?`)) {
      try {
        await api.delete(`/items/${id}`);
        notifySuccess("Record purged");
        fetchItems(pagination.page);
      } catch (error) {
        notifyError("Termination failed");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PUBLISHED': return styles.statusSuccess;
      case 'DRAFT': return styles.statusWarning;
      case 'ARCHIVED': return styles.statusDanger;
      default: return '';
    }
  };

  const headers = ['UID', 'IDENTIFIER', 'CATEGORY', 'STATUS', 'ACTION'];

  return (
    <div className="reveal-line">
      <PageHeader 
        title="Catalog Management"
        description="Manage product registry, specifications, and availability status."
        actionLabel="Add Item"
        onAction={() => router.push('/dashboard/items/add')}
      />

      <Toolbar 
        searchPlaceholder="Search registry..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: 'Status',
            value: filterStatus,
            options: [
              { label: 'Published', value: 'PUBLISHED' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Archived', value: 'ARCHIVED' }
            ],
            onChange: setFilterStatus
          }
        ]}
      />

      <DataTable 
        headers={headers}
        pagination={{
          currentPage: pagination.page,
          lastPage: pagination.lastPage,
          onPageChange: onPageChange
        }}
      >
        {loading ? (
          <tr>
            <td colSpan={headers.length}>
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>SYNCING CATALOG...</p>
              </div>
            </td>
          </tr>
        ) : items.length > 0 ? (
          items.map((item: any) => (
            <tr key={item.id}>
              <td className={styles.mono}>#{item.id}</td>
              <td>
                <div className={styles.bold}>{item.name?.toUpperCase()}</div>
                <div className={styles.subtext}>{item.slug}</div>
              </td>
              <td>{item.category?.name || <span className={styles.dimmed}>UNASSIGNED</span>}</td>
              <td>
                <span className={`${styles.tag} ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                {item.isHighlight && <span className={`${styles.tag} ${styles.tagHighlight}`} style={{marginLeft: '4px'}}>HIGHLIGHT</span>}
              </td>
              <td className={styles.actionColumn}>
                <div className={styles.actionGroup}>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => router.push(`/dashboard/items/${item.id}`)}
                    title="View Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => router.push(`/dashboard/items/${item.id}/edit`)}
                    title="Edit Record"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                    onClick={() => handleDelete(item.id, item.name)}
                    title="Purge Record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length}>
              <div className={styles.emptyState}>No registry entries found</div>
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}