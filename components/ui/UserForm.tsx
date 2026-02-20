"use client";

import React, { useState, useEffect } from 'react';
import styles from './UserForm.module.css';

interface UserFormProps {
  initialData?: {
    name: string;
    email: string;
    role: string;
  };
  onSubmit: (data: any) => void;
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
}

export function UserForm({ initialData, onSubmit, loading, submitLabel, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STAFF'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData, password: '' }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.form}>
      <div className={styles.section}>
        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Full Name</label>
            <span className={styles.helper}>Official name for system identification.</span>
          </div>
          <input
            type="text"
            name="name"
            required
            className={styles.input}
            placeholder="e.g. Steven Mulya"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Email Address</label>
            <span className={styles.helper}>Primary identifier for login and security.</span>
          </div>
          <input
            type="email"
            name="email"
            required
            className={styles.input}
            placeholder="example@mulatama.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Security Key</label>
              <span className={styles.helper}>{initialData ? 'Leave blank to keep current' : 'Min. 8 characters required.'}</span>
            </div>
            <input
              type="password"
              name="password"
              required={!initialData}
              className={styles.input}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Access Level</label>
              <span className={styles.helper}>Define user privilege permissions.</span>
            </div>
            <select
              name="role"
              className={styles.select}
              value={formData.role}
              onChange={handleChange}
            >
              <option value="STAFF">Staff Personnel</option>
              <option value="MANAGER">Operational Manager</option>
              <option value="OWNER">System Owner</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Processing...' : submitLabel}
        </button>
      </div>
    </form>
  );
}