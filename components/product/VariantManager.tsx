"use client";

import React, { useState } from 'react';
import { Trash2, Settings, RefreshCw } from 'lucide-react';
import styles from './VariantManager.module.css';

export interface VariantItem {
    sku: string;
    options: Record<string, string>;
    price: number;
    stock: number;
    weight: number;
}

interface VariantManagerProps {
    variants: VariantItem[];
    onChange: (variants: VariantItem[]) => void;
}

export default function VariantManager({ variants, onChange }: VariantManagerProps) {
    const [optionName, setOptionName] = useState('');
    const [optionValues, setOptionValues] = useState('');
    const [definedOptions, setDefinedOptions] = useState<{ name: string, values: string[] }[]>([]);

    const handleAddOption = () => {
        if (!optionName || !optionValues) return;
        const values = optionValues.split(',').map(v => v.trim()).filter(v => v !== '');
        setDefinedOptions([...definedOptions, { name: optionName, values }]);
        setOptionName('');
        setOptionValues('');
    };

    const handleRemoveOption = (index: number) => {
        const newOpts = [...definedOptions];
        newOpts.splice(index, 1);
        setDefinedOptions(newOpts);
    };

    const generateVariants = () => {
        if (definedOptions.length === 0) return;

        const cartesian = (args: any[]): any[] => {
            const r: any[] = [], max = args.length - 1;
            function helper(arr: any[], i: number) {
                for (let j = 0, l = args[i].values.length; j < l; j++) {
                    const a = arr.slice(0);
                    a.push({ [args[i].name]: args[i].values[j] });
                    if (i === max) r.push(Object.assign({}, ...a));
                    else helper(a, i + 1);
                }
            }
            helper([], 0);
            return r;
        };

        const combinations = cartesian(definedOptions);
        
        const newVariants: VariantItem[] = combinations.map((combo) => {
            const skuSuffix = Object.values(combo).join('-').toUpperCase().replace(/\s+/g, '');
            return {
                sku: `VAR-${skuSuffix}-${Date.now().toString().slice(-4)}`,
                options: combo,
                price: 0,
                stock: 0,
                weight: 0
            };
        });

        onChange(newVariants);
    };

    const handleVariantChange = (index: number, field: keyof VariantItem, value: any) => {
        const newVars = [...variants];
        newVars[index] = { ...newVars[index], [field]: value };
        onChange(newVars);
    };

    const handleRemoveVariant = (index: number) => {
        const newVars = [...variants];
        newVars.splice(index, 1);
        onChange(newVars);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h4 className={styles.header}>
                    <Settings size={14} /> 1. Define Attributes
                </h4>
                
                <div className={styles.inputGroup}>
                    <input 
                        type="text" 
                        placeholder="Name (e.g. Size)" 
                        value={optionName}
                        onChange={e => setOptionName(e.target.value)}
                        className={`${styles.input} ${styles.inputName}`}
                    />
                    <input 
                        type="text" 
                        placeholder="Values (comma separated, e.g. S, M, L)" 
                        value={optionValues}
                        onChange={e => setOptionValues(e.target.value)}
                        className={`${styles.input} ${styles.inputValues}`}
                    />
                    <button 
                        type="button" 
                        onClick={handleAddOption}
                        className={styles.addButton}
                    >
                        Add
                    </button>
                </div>

                <div className={styles.tagsContainer}>
                    {definedOptions.map((opt, idx) => (
                        <div key={idx} className={styles.tag}>
                            <strong>{opt.name}:</strong> 
                            <span className={styles.tagValues}>{opt.values.join(', ')}</span>
                            <button type="button" onClick={() => handleRemoveOption(idx)} className={styles.removeTagBtn}><Trash2 size={12} /></button>
                        </div>
                    ))}
                </div>

                {definedOptions.length > 0 && (
                    <button 
                        type="button" 
                        onClick={generateVariants}
                        className={styles.generateBtn}
                    >
                        <RefreshCw size={14} /> Generate Variants Table
                    </button>
                )}
            </div>

            {variants.length > 0 && (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead className={styles.thead}>
                            <tr>
                                <th className={styles.th} style={{ width: 'auto' }}>Variant</th>
                                <th className={styles.th} style={{ width: '120px' }}>Price ($)</th>
                                <th className={styles.th} style={{ width: '80px' }}>Stock</th>
                                <th className={styles.th} style={{ width: '140px' }}>SKU</th>
                                <th className={styles.th} style={{ width: '100px' }}>Weight (g)</th>
                                <th className={styles.th} style={{ width: '40px', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((variant, idx) => (
                                <tr key={idx} className={styles.tr}>
                                    <td className={styles.td}>
                                        {Object.entries(variant.options).map(([k, v]) => (
                                            <span key={k} className={styles.variantTag}>
                                                {v}
                                            </span>
                                        ))}
                                    </td>
                                    <td className={styles.td}>
                                        <input type="number" value={variant.price} onChange={e => handleVariantChange(idx, 'price', e.target.value)} className={styles.tableInput} />
                                    </td>
                                    <td className={styles.td}>
                                        <input type="number" value={variant.stock} onChange={e => handleVariantChange(idx, 'stock', e.target.value)} className={styles.tableInput} />
                                    </td>
                                    <td className={styles.td}>
                                        <input type="text" value={variant.sku} onChange={e => handleVariantChange(idx, 'sku', e.target.value)} className={styles.tableInput} />
                                    </td>
                                    <td className={styles.td}>
                                        <input type="number" value={variant.weight} onChange={e => handleVariantChange(idx, 'weight', e.target.value)} className={styles.tableInput} />
                                    </td>
                                    <td className={styles.td}>
                                        <button type="button" onClick={() => handleRemoveVariant(idx)} className={styles.removeRowBtn}><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}