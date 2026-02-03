"use client";

import React, { useState } from 'react';
import { Country, State, City } from 'country-state-city';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import styles from './AddressForm.module.css';

export default function AddressForm() {
    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [fullAddress, setFullAddress] = useState('');

    const countries = Country.getAllCountries();
    const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
    const cities = selectedState ? City.getCitiesOfState(selectedCountry, selectedState) : [];

    return (
        <div className={styles.container}>
            <h3>Contact & Location</h3>

            <div className={styles.formGroup}>
                <label>Phone Number</label>
                <div className={styles.phoneWrapper}>
                    <PhoneInput
                        country={'id'}
                        value={phone}
                        onChange={phone => setPhone(phone)}
                        inputClass={styles.customPhoneInput}
                        buttonClass={styles.customPhoneButton}
                        enableSearch={true}
                        disableSearchIcon={true}
                    />
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.formGroup}>
                    <label>Country</label>
                    <select 
                        value={selectedCountry} 
                        onChange={(e) => {
                            setSelectedCountry(e.target.value);
                            setSelectedState('');
                            setSelectedCity('');
                        }}
                        className={styles.select}
                    >
                        <option value="">Select Country</option>
                        {countries.map((c) => (
                            <option key={c.isoCode} value={c.isoCode}>
                                {c.flag} {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>State / Province</label>
                    <select 
                        value={selectedState} 
                        onChange={(e) => {
                            setSelectedState(e.target.value);
                            setSelectedCity('');
                        }}
                        className={styles.select}
                        disabled={!selectedCountry}
                    >
                        <option value="">Select State</option>
                        {states.map((s) => (
                            <option key={s.isoCode} value={s.isoCode}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.formGroup}>
                    <label>City</label>
                    <select 
                        value={selectedCity} 
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className={styles.select}
                        disabled={!selectedState}
                    >
                        <option value="">Select City</option>
                        {cities.map((c) => (
                            <option key={c.name} value={c.name}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Street Address</label>
                    <input 
                        type="text" 
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        placeholder="Street name, House No..." 
                        className={styles.input}
                    />
                </div>
            </div>
        </div>
    );
}