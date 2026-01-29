"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Settings, RefreshCw } from 'lucide-react';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#171717', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={14} /> 1. Define Attributes
                </h4>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <input 
                        type="text" 
                        placeholder="Name (e.g. Size)" 
                        value={optionName}
                        onChange={e => setOptionName(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d4d4d4', fontSize: '13px', outline: 'none' }}
                    />
                    <input 
                        type="text" 
                        placeholder="Values (comma separated, e.g. S, M, L)" 
                        value={optionValues}
                        onChange={e => setOptionValues(e.target.value)}
                        style={{ flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #d4d4d4', fontSize: '13px', outline: 'none' }}
                    />
                    <button 
                        type="button" 
                        onClick={handleAddOption}
                        style={{ background: '#171717', color: '#fff', border: 'none', borderRadius: '6px', padding: '0 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                    >
                        Add
                    </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {definedOptions.map((opt, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #e5e5e5', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                            <strong>{opt.name}:</strong> 
                            <span style={{ color: '#525252' }}>{opt.values.join(', ')}</span>
                            <button type="button" onClick={() => handleRemoveOption(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3' }}><Trash2 size={12} /></button>
                        </div>
                    ))}
                </div>

                {definedOptions.length > 0 && (
                    <button 
                        type="button" 
                        onClick={generateVariants}
                        style={{ marginTop: '16px', width: '100%', padding: '10px', background: '#fff', border: '1px dashed #171717', color: '#171717', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={14} /> Generate Variants Table
                    </button>
                )}
            </div>

            {variants.length > 0 && (
                <div style={{ overflowX: 'auto', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
                        <thead style={{ background: '#f5f5f5', color: '#525252', fontWeight: 600 }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>Variant</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e5e5', width: '120px' }}>Price ($)</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e5e5', width: '80px' }}>Stock</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e5e5', width: '120px' }}>SKU</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e5e5', width: '100px' }}>Weight (g)</th>
                                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e5e5', width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((variant, idx) => (
                                <tr key={idx} style={{ background: '#fff', borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '12px' }}>
                                        {Object.entries(variant.options).map(([k, v]) => (
                                            <span key={k} style={{ display: 'inline-block', padding: '2px 6px', background: '#f5f5f5', borderRadius: '4px', fontSize: '11px', marginRight: '4px', border: '1px solid #e5e5e5' }}>
                                                {v}
                                            </span>
                                        ))}
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input type="number" value={variant.price} onChange={e => handleVariantChange(idx, 'price', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #d4d4d4', borderRadius: '4px', boxSizing: 'border-box' }} />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input type="number" value={variant.stock} onChange={e => handleVariantChange(idx, 'stock', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #d4d4d4', borderRadius: '4px', boxSizing: 'border-box' }} />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input type="text" value={variant.sku} onChange={e => handleVariantChange(idx, 'sku', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #d4d4d4', borderRadius: '4px', boxSizing: 'border-box' }} />
                                    </td>
                                    <td style={{ padding: '8px' }}>
                                        <input type="number" value={variant.weight} onChange={e => handleVariantChange(idx, 'weight', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #d4d4d4', borderRadius: '4px', boxSizing: 'border-box' }} />
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <button type="button" onClick={() => handleRemoveVariant(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3' }}><Trash2 size={14} /></button>
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