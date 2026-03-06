"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { notifyError } from '@/utils/toastHelper';
import { ArrowUp, ArrowDown, Package, Calendar, User, ArrowLeft } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Toolbar } from '@/components/ui/Toolbar';
import { PageHeader } from '@/components/ui/PageHeader';
import styles from './page.module.css';

export default function SingleItemHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params?.id;

  const [history, setHistory] = useState<any[]>([]);
  const [itemInfo, setItemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [pagination, setPagination] = useState({ page: 1, lastPage: 1, total: 0 });

  const fetchHistory = useCallback(async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res: any = await api.get('/items-history', {
        params: {
          page: pageNumber,
          itemId: itemId,
          search: searchQuery || undefined,
          sortOrder: sortOrder
        }
      });
      
      const responseData = res?.data?.data || res?.data || res;
      
      setHistory(responseData.items || []);
      if (responseData.items?.length > 0 && !itemInfo) {
        setItemInfo(responseData.items[0].item);
      }

      setPagination({
        page: responseData.meta?.page || 1,
        lastPage: responseData.meta?.lastPage || 1,
        total: responseData.meta?.total || 0
      });
    } catch (error) {
      notifyError("Failed to synchronize item audit trail");
    } finally {
      setLoading(false);
    }
  }, [itemId, searchQuery, sortOrder, itemInfo]);

  useEffect(() => {
    if (itemId) fetchHistory(1);
  }, [itemId, fetchHistory]);

  const toggleSort = () => {
    setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderChangeLog = (log: any) => {
    if (!log) return <span className={styles.noData}>NO SPECIFIC CHANGES RECORDED</span>;
    
    return (
      <div className={styles.logWrapper}>
        {Object.entries(log).map(([key, value]: [string, any]) => {
          if (key === 'module') return null;
          return (
            <div key={key} className={styles.logRow}>
              <span className={styles.logKey}>{key.toUpperCase()}</span>
              <div className={styles.logDiff}>
                <span className={styles.oldVal}>{String(value.old ?? 'NULL')}</span>
                <span className={styles.arrow}>→</span>
                <span className={styles.newVal}>{String(value.new ?? 'UPDATED')}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const headers = [
    'AUDIT TIMESTAMP',
    'MODIFICATION DETAILS',
    'OPERATOR INFO',
    <div key="sort-trigger" className={styles.sortContainer} onClick={toggleSort}>
      <span className={styles.sortLabel}>ORDER: {sortOrder}</span>
      {sortOrder === 'DESC' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
    </div>
  ];

  return (
    <div className="reveal-line">
      <div className={styles.topNav}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={14} />
          <span>BACK TO REGISTRY</span>
        </button>
      </div>

      <PageHeader 
        title={itemInfo ? `History: ${itemInfo.name?.toUpperCase()}` : `Audit Log #${itemId}`}
        description={`Detailed tracking of all registry updates and state changes for this specific item.`}
      />

      <Toolbar 
        searchPlaceholder="Filter by operator email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <DataTable 
        headers={headers}
        pagination={{
          currentPage: pagination.page,
          lastPage: pagination.lastPage,
          onPageChange: (p) => fetchHistory(p)
        }}
      >
        {loading ? (
          <tr>
            <td colSpan={headers.length}>
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>RETRIEVING ITEM LOGS...</p>
              </div>
            </td>
          </tr>
        ) : history.length > 0 ? (
          history.map((log: any) => (
            <tr key={log.id}>
              <td className={styles.dateCell}>
                <div className={styles.iconBox}>
                  <Calendar size={12} />
                  <span>{formatDate(log.createdAt)}</span>
                </div>
              </td>
              <td>
                {renderChangeLog(log.changeLog)}
              </td>
              <td>
                <div className={styles.operatorBox}>
                  <User size={14} className={styles.operatorIcon} />
                  <div className={styles.operatorDetails}>
                    <div className={styles.operatorMain}>
                      {log.creator?.name || 'UNKNOWN'}
                    </div>
                    <div className={styles.operatorEmail}>{log.creator?.email || '-'}</div>
                    <div className={styles.mono}>UID: #{log.createdBy}</div>
                  </div>
                </div>
              </td>
              <td></td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length}>
              <div className={styles.emptyState}>No specific history records for this item.</div>
            </td>
          </tr>
        )}
      </DataTable>
    </div>
  );
}