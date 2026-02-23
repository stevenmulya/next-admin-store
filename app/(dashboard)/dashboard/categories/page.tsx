"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Toolbar } from '@/components/ui/Toolbar';
import { PageHeader } from '@/components/ui/PageHeader';
import styles from './page.module.css';

export default function CategoryListPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, lastPage: 1, total: 0 });

  const fetchCategories = useCallback(async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res: any = await api.get('/item-categories', {
        params: {
          page: pageNumber,
          search: searchQuery || undefined,
        }
      });
      
      const responseData = res?.data?.data || res?.data || res;
      setCategories(responseData.items || []);
      setPagination({
        page: responseData.meta?.page || 1,
        lastPage: responseData.meta?.lastPage || 1,
        total: responseData.meta?.total || 0
      });
    } catch (error) {
      notifyError("Failed to sync categories");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCategories(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchCategories]);

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Delete category: ${name.toUpperCase()}?`)) {
      try {
        await api.delete(`/item-categories/${id}`);
        notifySuccess("Category removed");
        fetchCategories(pagination.page);
      } catch (error) {
        notifyError("Deletion failed");
      }
    }
  };

  const headers = ['NAME', 'TYPE', 'PARENT', 'SLUG', 'ACTION'];

  return (
    <div className="reveal-line">
      <PageHeader 
        title="Item Categories"
        description="Manage your item categories and subcategories in a flat list view."
        actionLabel="Add Category"
        onAction={() => router.push('/dashboard/categories/add')}
      />

      <Toolbar 
        searchPlaceholder="Search categories..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <DataTable 
        headers={headers}
        pagination={{
          currentPage: pagination.page,
          lastPage: pagination.lastPage,
          onPageChange: (p) => fetchCategories(p)
        }}
      >
        {loading ? (
          <tr>
            <td colSpan={headers.length}>
              <div className={styles.loadingState}><div className={styles.spinner}></div><p>SYNCING DATA...</p></div>
            </td>
          </tr>
        ) : categories.length > 0 ? (
          categories.map((cat: any) => {
            const isSubcategory = !!cat.parentId;

            return (
              <tr key={cat.id}>
                <td className={styles.bold}>
                  {cat.name}
                </td>
                <td>
                   <span className={isSubcategory ? styles.subBadge : styles.rootBadge}>
                     {isSubcategory ? 'SUBCATEGORY' : 'CATEGORY'}
                   </span>
                </td>
                <td>
                  {cat.parent?.name || <span className={styles.dimmed}>—</span>}
                </td>
                <td className={styles.mono}>{cat.slug}</td>
                <td className={styles.actionColumn}>
                  <div className={styles.actionGroup}>
                    {!isSubcategory && (
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => router.push(`/dashboard/categories/sub/add?parentId=${cat.id}`)}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                    <button 
                      className={styles.actionBtn} 
                      onClick={() => {
                        const editPath = isSubcategory 
                          ? `/dashboard/categories/sub/${cat.id}/edit`
                          : `/dashboard/categories/${cat.id}/edit`;
                        router.push(editPath);
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                      onClick={() => handleDelete(cat.id, cat.name)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={headers.length}>
              <div className={styles.emptyState}>No categories found</div>
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}