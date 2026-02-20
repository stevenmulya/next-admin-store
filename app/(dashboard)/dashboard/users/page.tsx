"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Toolbar } from '@/components/ui/Toolbar';
import styles from './page.module.css';

export default function UserListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    lastPage: 1,
    total: 0
  });

  const fetchUsers = useCallback(async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res: any = await api.get('/users', {
        params: {
          page: pageNumber,
          search: searchQuery || undefined,
          role: filterRole === 'ALL' ? undefined : filterRole
        }
      });
      
      let items = [];
      let meta = { page: 1, lastPage: 1, total: 0 };

      const responseData = res?.data?.data || res?.data || res;
      
      if (responseData?.items) {
        items = responseData.items;
        meta = responseData.meta || meta;
      } else if (Array.isArray(responseData)) {
        items = responseData;
      }

      setUsers(items);
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
  }, [searchQuery, filterRole]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchUsers(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filterRole, fetchUsers]);

  const onPageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchUsers(newPage);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Terminate access for: ${name.toUpperCase()}?`)) {
      try {
        await api.delete(`/users/${id}`);
        notifySuccess("Record purged");
        fetchUsers(pagination.page);
      } catch (error) {
        notifyError("Termination failed");
      }
    }
  };

  const headers = ['UID', 'IDENTIFIER', 'EMAIL_ADDRESS', 'PRIVILEGE', 'ACTION'];

  return (
    <div className="reveal-line">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>System directory</p>
        </div>
        <button className={styles.addBtn} onClick={() => router.push('/dashboard/users/add')}>
          <Plus size={16} />
          <span>Add User</span>
        </button>
      </div>

      <Toolbar 
        searchPlaceholder="Search by name or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: 'ALL PRIVILEGES',
            value: filterRole,
            options: [
              { label: 'OWNER', value: 'OWNER' },
              { label: 'MANAGER', value: 'MANAGER' },
              { label: 'STAFF', value: 'STAFF' }
            ],
            onChange: setFilterRole
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
                <p>FETCHING_DATA...</p>
              </div>
            </td>
          </tr>
        ) : users.length > 0 ? (
          users.map((u: any) => (
            <tr key={u.id}>
              <td className={styles.mono}>#{u.id}</td>
              <td className={styles.bold}>{u.name?.toUpperCase()}</td>
              <td>{u.email}</td>
              <td><span className={styles.tag}>{u.role}</span></td>
              <td className={styles.actionColumn}>
                <div className={styles.actionGroup}>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => router.push(`/dashboard/users/${u.id}/edit`)}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                    onClick={() => handleDelete(u.id, u.name)}
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
              <div className={styles.emptyState}>NO_RECORDS_FOUND</div>
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}