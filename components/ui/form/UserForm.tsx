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
            <span className={styles.helper}>Enter the user's display name.</span>
          </div>
          <input
            type="text"
            name="name"
            required
            className={styles.input}
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelBlock}>
            <label className={styles.label}>Email Address</label>
            <span className={styles.helper}>This will be used as the username for login.</span>
          </div>
          <input
            type="email"
            name="email"
            required
            className={styles.input}
            placeholder="username@company.com"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <div className={styles.labelBlock}>
              <label className={styles.label}>Password</label>
              <span className={styles.helper}>{initialData ? 'Leave blank to keep the current password' : 'Use at least 8 characters.'}</span>
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
              <label className={styles.label}>Account Role</label>
              <span className={styles.helper}>Set the access level for this account.</span>
            </div>
            <select
              name="role"
              className={styles.select}
              value={formData.role}
              onChange={handleChange}
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}