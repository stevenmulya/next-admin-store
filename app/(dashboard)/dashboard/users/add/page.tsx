"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import styles from './page.module.css';
import { notifyError, notifySuccess } from '@/utils/toastHelper';
import { Loader2, ArrowLeft, Save, User, FileText, Lock, ShieldCheck, MapPin, Eye, EyeOff, CheckSquare, ClipboardList } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Country, State, City } from 'country-state-city';

interface SurveyField {
    id: number;
    label: string;
    options: any;
    is_required: boolean;
}

export default function AddCustomerPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [surveyFields, setSurveyFields] = useState<SurveyField[]>([]);
    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [useSameContact, setUseSameContact] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '', 
    });

    const [surveyAnswers, setSurveyAnswers] = useState<Record<number, string>>({});

    const [addressData, setAddressData] = useState({
        label: 'Home',
        recipient_name: '',
        recipient_phone: '',
        countryCode: '',
        stateCode: '',
        cityName: '',
        district: '',
        postal_code: '',
        full_address: '',
        note: ''
    });

    const ensureArray = (options: any): string[] => {
        if (!options) return [];
        if (Array.isArray(options)) return options;
        if (typeof options === 'string') {
            try {
                const parsed = JSON.parse(options);
                return Array.isArray(parsed) ? parsed : [options];
            } catch {
                return options.split(',').map(s => s.trim()).filter(s => s !== '');
            }
        }
        return [];
    };

    const countries = Country.getAllCountries();
    const states = addressData.countryCode ? State.getStatesOfCountry(addressData.countryCode) : [];
    const cities = addressData.stateCode ? City.getCitiesOfState(addressData.countryCode, addressData.stateCode) : [];

    useEffect(() => {
        const fetchSurveyConfig = async () => {
            try {
                const response = await api.get('/customers/manage/fields');
                const activeFields = (response.data.data || []).filter((f: any) => f.is_active);
                setSurveyFields(activeFields);
            } catch (error) {
                console.error("Failed to load survey config");
            } finally {
                setIsConfigLoading(false);
            }
        };
        fetchSurveyConfig();
    }, []);

    useEffect(() => {
        if (useSameContact) {
            setAddressData(prev => ({
                ...prev,
                recipient_name: formData.name,
                recipient_phone: formData.phone
            }));
        }
    }, [useSameContact, formData.name, formData.phone]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSurveyChange = (fieldId: number, value: string) => {
        setSurveyAnswers(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAddressData(prev => ({ ...prev, [name]: value }));
        if (useSameContact && (name === 'recipient_name' || name === 'recipient_phone')) {
            setUseSameContact(false);
        }
    };

    const handleLocationSelect = (field: string, value: string) => {
        setAddressData(prev => {
            const updates: any = { [field]: value };
            if (field === 'countryCode') {
                updates.stateCode = '';
                updates.cityName = '';
            } else if (field === 'stateCode') {
                updates.cityName = '';
            }
            return { ...prev, ...updates };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.phone || formData.phone.length < 5) {
            notifyError("Phone number is required.");
            return;
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
            notifyError("Password must be at least 8 characters.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            notifyError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        const countryName = countries.find(c => c.isoCode === addressData.countryCode)?.name || '';
        const stateName = states.find(s => s.isoCode === addressData.stateCode)?.name || addressData.stateCode;
        
        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            survey_responses: Object.entries(surveyAnswers).map(([fieldId, answer]) => ({
                field_id: parseInt(fieldId),
                answer
            })),
            addresses: addressData.full_address ? [{
                label: addressData.label,
                recipient_name: useSameContact ? formData.name : (addressData.recipient_name || formData.name),
                phone: useSameContact ? formData.phone : (addressData.recipient_phone || formData.phone),
                country: countryName,
                state: stateName,
                city: addressData.cityName,
                district: addressData.district,
                postal_code: addressData.postal_code,
                full_address: addressData.full_address,
                note: addressData.note,
                is_primary: true
            }] : []
        };

        try {
            await api.post('/customers/register', payload);
            notifySuccess('Customer registered successfully');
            router.push('/dashboard/users');
        } catch (error: any) {
            notifyError(error.response?.data?.message || 'Failed to create customer');
            setIsLoading(false); 
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Add New Customer</h1>
                    <p className={styles.subtitle}>Create a new user account and set up their primary address.</p>
                </div>
                <Link href="/dashboard/users" className={styles.backLink}>
                    <ArrowLeft size={16} /> Back to List
                </Link>
            </div>

            <form onSubmit={handleSubmit} className={styles.mainGrid} autoComplete="off">
                <div className={styles.leftColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><User size={18} /> Account Information</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name <span className={styles.required}>*</span></label>
                            <input required name="name" className={styles.input} value={formData.name} onChange={handleProfileChange} placeholder="John Doe" />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address <span className={styles.required}>*</span></label>
                                <input required type="email" name="email" className={styles.input} value={formData.email} onChange={handleProfileChange} placeholder="john@example.com" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Phone Number <span className={styles.required}>*</span></label>
                                <div className={styles.phoneWrapper}>
                                    <PhoneInput
                                        country={'id'}
                                        value={formData.phone}
                                        onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                                        inputClass={styles.customPhoneInput}
                                        buttonClass={styles.customPhoneButton}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeaderRow}>
                            <h3 className={styles.cardTitle}><MapPin size={18} /> Primary Address</h3>
                            <div className={styles.checkboxContainer}>
                                <label className={`${styles.checkboxLabel} ${useSameContact ? styles.checked : ''}`}>
                                    <input type="checkbox" checked={useSameContact} onChange={(e) => setUseSameContact(e.target.checked)} className={styles.hiddenCheckbox} />
                                    <CheckSquare size={14} /> Use profile contact info
                                </label>
                            </div>
                        </div>
                        
                        <div className={styles.row}>
                            <div className={styles.formGroup}><label className={styles.label}>Address Label</label>
                                <input name="label" className={styles.input} value={addressData.label} onChange={handleAddressChange} placeholder="Home, Office" />
                            </div>
                            <div className={styles.formGroup}><label className={styles.label}>Recipient Name</label>
                                <input name="recipient_name" className={`${styles.input} ${useSameContact ? styles.readOnly : ''}`} value={addressData.recipient_name} onChange={handleAddressChange} readOnly={useSameContact} placeholder="Receiver's name" />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formGroup}><label className={styles.label}>Country</label>
                                <select className={styles.select} value={addressData.countryCode} onChange={(e) => handleLocationSelect('countryCode', e.target.value)}>
                                    <option value="">Select Country</option>
                                    {countries.map((c) => (<option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>))}
                                </select>
                            </div>
                            <div className={styles.formGroup}><label className={styles.label}>State / Province</label>
                                <select className={styles.select} value={addressData.stateCode} onChange={(e) => handleLocationSelect('stateCode', e.target.value)} disabled={!addressData.countryCode}>
                                    <option value="">Select State</option>
                                    {states.map((s) => (<option key={s.isoCode} value={s.isoCode}>{s.name}</option>))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formGroup}><label className={styles.label}>City</label>
                                <select className={styles.select} value={addressData.cityName} onChange={(e) => handleLocationSelect('cityName', e.target.value)} disabled={!addressData.stateCode}>
                                    <option value="">Select City</option>
                                    {cities.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
                                </select>
                            </div>
                            <div className={styles.formGroup}><label className={styles.label}>District</label>
                                <input name="district" className={styles.input} value={addressData.district} onChange={handleAddressChange} placeholder="District" />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.formGroup}><label className={styles.label}>Postal Code</label>
                                <input name="postal_code" className={styles.input} value={addressData.postal_code} onChange={handleAddressChange} placeholder="Zip Code" />
                            </div>
                            <div className={styles.formGroup}><label className={styles.label}>Recipient Phone</label>
                                <input name="recipient_phone" className={`${styles.input} ${useSameContact ? styles.readOnly : ''}`} value={addressData.recipient_phone} onChange={handleAddressChange} readOnly={useSameContact} placeholder="Receiver's phone" />
                            </div>
                        </div>

                        <div className={styles.formGroup}><label className={styles.label}>Full Address</label>
                            <textarea name="full_address" className={styles.textarea} value={addressData.full_address} onChange={handleAddressChange} placeholder="Street, house number, unit..." rows={3} />
                        </div>

                        <div className={styles.formGroup}><label className={styles.label}>Delivery Note (Optional)</label>
                            <input name="note" className={styles.input} value={addressData.note} onChange={handleAddressChange} placeholder="e.g. Leave at the front desk" />
                        </div>
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}><Lock size={18} /> Security</h3>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Password <span className={styles.required}>*</span></label>
                            <div className={styles.passwordWrapper}>
                                <input required type={showPassword ? "text" : "password"} name="password" className={styles.inputPassword} value={formData.password} onChange={handleProfileChange} />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Confirm <span className={styles.required}>*</span></label>
                            <div className={styles.passwordWrapper}>
                                <input required type={showConfirmPassword ? "text" : "password"} name="confirmPassword" className={styles.inputPassword} value={formData.confirmPassword} onChange={handleProfileChange} />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                            </div>
                        </div>
                    </div>

                    {surveyFields.length > 0 && (
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}><ClipboardList size={18} /> Additional Survey</h3>
                            {surveyFields.map((field) => (
                                <div key={field.id} className={styles.formGroup}>
                                    <label className={styles.label}>{field.label} {field.is_required && <span className={styles.required}>*</span>}</label>
                                    <select 
                                        required={field.is_required} 
                                        className={styles.select} 
                                        value={surveyAnswers[field.id] || ''} 
                                        onChange={(e) => handleSurveyChange(field.id, e.target.value)}
                                    >
                                        <option value="">Select Option</option>
                                        {ensureArray(field.options).map((opt, idx) => (
                                            <option key={idx} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.card}>
                        <button type="submit" className={styles.submitBtn} disabled={isLoading || isConfigLoading}>
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>{isLoading ? 'Processing...' : 'Register Customer'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}