"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { Edit2, Trash2, Eye, ArrowUp, ArrowDown, Pin, Star } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Toolbar } from '@/components/ui/Toolbar';
import { PageHeader } from '@/components/ui/PageHeader';
import styles from './page.module.css';

export default function ItemListPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterSubCategory, setFilterSubCategory] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  
  const [pagination, setPagination] = useState({ page: 1, lastPage: 1, total: 0 });

  const fetchFilters = useCallback(async () => {
    try {
      const res: any = await api.get('/item-categories?limit=100');
      const allNodes = res?.data?.data?.items || res?.data?.items || [];
      const roots = allNodes.filter((cat: any) => !cat.parentId);
      const subs = allNodes.filter((cat: any) => cat.parentId);
      setCategories(roots);
      setSubCategories(subs);
    } catch (error) {
      setCategories([]);
      setSubCategories([]);
    }
  }, []);

  const fetchItems = useCallback(async (pageNumber = 1) => {
    try {
      setLoading(true);
      const effectiveCategoryId = filterSubCategory !== 'ALL' 
        ? filterSubCategory 
        : (filterCategory !== 'ALL' ? filterCategory : undefined);

      const res: any = await api.get('/items', {
        params: {
          page: pageNumber,
          search: searchQuery || undefined,
          status: filterStatus === 'ALL' ? undefined : filterStatus,
          categoryId: effectiveCategoryId
        }
      });
      
      const responseData = res?.data?.data || res?.data || res;
      let fetchedItems = responseData.items || [];

      const sortedItems = [...fetchedItems].sort((a: any, b: any) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'DESC' ? dateB - dateA : dateA - dateB;
      });

      setItems(sortedItems);
      setPagination({
        page: responseData.meta?.page || 1,
        lastPage: responseData.meta?.lastPage || 1,
        total: responseData.meta?.total || 0
      });
    } catch (error) {
      notifyError("Database synchronization failed");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus, filterCategory, filterSubCategory, sortOrder]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchItems(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filterStatus, filterCategory, filterSubCategory, sortOrder, fetchItems]);

  const handleCategoryChange = (val: string) => {
    setFilterCategory(val);
    setFilterSubCategory('ALL');
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC');
  };

  const filteredSubOptions = subCategories.filter(sub => 
    filterCategory === 'ALL' ? true : sub.parentId === Number(filterCategory)
  );

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Purge item record: ${name.toUpperCase()}?`)) {
      try {
        await api.delete(`/items/${id}`);
        notifySuccess("Item record purged");
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const headers = [
    'UID', 
    'IDENTIFIER', 
    'CATEGORY', 
    'STATUS', 
    <div key="sort-trigger" className={styles.sortContainer} onClick={toggleSort}>
      <span className={styles.sortLabel}>SORT: {sortOrder === 'DESC' ? 'NEWEST' : 'OLDEST'}</span>
      {sortOrder === 'DESC' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
    </div>,
    'ACTION'
  ];

  return (
    <div className="reveal-line">
      <PageHeader 
        title="Item Management"
        description="Manage item registry, specifications, and availability status."
        actionLabel="Add Item"
        onAction={() => router.push('/dashboard/items/add')}
      />

      <Toolbar 
        searchPlaceholder="Search item registry..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: 'Category',
            value: filterCategory,
            options: [
              { label: 'All Categories', value: 'ALL' },
              ...categories.map(cat => ({ label: cat.name, value: cat.id.toString() }))
            ],
            onChange: handleCategoryChange
          },
          {
            label: 'Subcategory',
            value: filterSubCategory,
            options: [
              { label: 'All Subcategories', value: 'ALL' },
              ...filteredSubOptions.map(sub => ({ label: sub.name, value: sub.id.toString() }))
            ],
            onChange: setFilterSubCategory
          },
          {
            label: 'Status',
            value: filterStatus,
            options: [
              { label: 'All Status', value: 'ALL' },
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
          onPageChange: (p) => fetchItems(p)
        }}
      >
        {loading ? (
          <tr>
            <td colSpan={headers.length}>
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>SYNCING ITEM REGISTRY...</p>
              </div>
            </td>
          </tr>
        ) : items.length > 0 ? (
          items.map((item: any) => (
            <tr key={item.id} className={item.isPinned ? styles.pinnedRow : ''}>
              <td className={styles.mono}>#{item.id}</td>
              <td>
                <div className={styles.nameRow}>
                  <div className={styles.bold}>{item.name?.toUpperCase()}</div>
                  {item.isPinned && <Pin size={14} className={styles.pinIcon} />}
                  {item.isHighlight && <Star size={14} className={styles.highlightIcon} />}
                </div>
                <div className={styles.subtext}>{item.slug}</div>
              </td>
              <td>
                <div className={styles.categoryInfo}>
                  {item.category?.parent?.name && (
                    <span className={styles.parentName}>{item.category.parent.name}</span>
                  )}
                  <span className={styles.mainName}>{item.category?.name || 'UNASSIGNED'}</span>
                </div>
              </td>
              <td>
                <span className={`${styles.tag} ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className={styles.dateCell}>
                {formatDate(item.createdAt)}
              </td>
              <td className={styles.actionColumn}>
                <div className={styles.actionGroup}>
                  <button className={styles.actionBtn} onClick={() => router.push(`/dashboard/items/${item.id}`)} title="View Details">
                    <Eye size={14} />
                  </button>
                  <button className={styles.actionBtn} onClick={() => router.push(`/dashboard/items/${item.id}/edit`)} title="Edit Record">
                    <Edit2 size={14} />
                  </button>
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(item.id, item.name)} title="Purge Record">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length}>
              <div className={styles.emptyState}>No item entries found</div>
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}