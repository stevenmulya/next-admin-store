"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import styles from './CategorySelector.module.css';

interface Category {
    id: number;
    name: string;
    children?: Category[];
}

interface Props {
    tree: Category[];
    onSelect: (id: number) => void;
    selectedId?: number | null;
}

interface SearchableSelectProps {
    options: Category[];
    value: number | null;
    onChange: (id: number) => void;
    placeholder: string;
    level: number;
}

const SearchableSelect = ({ options, value, onChange, placeholder, level }: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.selectContainer} ref={containerRef} style={{ marginLeft: level * 0 }}>
            <div 
                className={`${styles.selectTrigger} ${isOpen ? styles.triggerActive : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedOption ? styles.textSelected : styles.textPlaceholder}>
                    {selectedOption ? selectedOption.name : placeholder}
                </span>
                <ChevronDown size={16} className={styles.icon} />
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.searchInputWrapper}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className={styles.optionsList}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option.id}
                                    className={`${styles.option} ${option.id === value ? styles.optionSelected : ''}`}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    {option.name}
                                </div>
                            ))
                        ) : (
                            <div className={styles.noResults}>No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function CategorySelector({ tree, onSelect, selectedId }: Props) {
    const [selectedPath, setSelectedPath] = useState<Category[]>([]);

    const findPath = (nodes: Category[], targetId: number, path: Category[] = []): Category[] | null => {
        for (const node of nodes) {
            if (node.id === targetId) return [...path, node];
            if (node.children) {
                const found = findPath(node.children, targetId, [...path, node]);
                if (found) return found;
            }
        }
        return null;
    };

    useEffect(() => {
        if (selectedId && tree.length > 0) {
            const path = findPath(tree, selectedId);
            if (path) setSelectedPath(path);
        } else if (!selectedId) {
            setSelectedPath([]);
        }
    }, [selectedId, tree]);

    const handleSelect = (level: number, categoryId: number) => {
        const category = findCategoryById(tree, categoryId);
        if (!category) return;

        const newPath = [...selectedPath.slice(0, level), category];
        setSelectedPath(newPath);
        onSelect(category.id);
    };

    const findCategoryById = (nodes: Category[], id: number): Category | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findCategoryById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const renderSelectors = () => {
        const selectors = [];
        
        let currentOptions = tree;
        selectors.push(
            <SearchableSelect
                key="root"
                level={0}
                options={currentOptions}
                value={selectedPath[0]?.id || null}
                onChange={(id) => handleSelect(0, id)}
                placeholder="Select Main Category"
            />
        );

        selectedPath.forEach((category, index) => {
            if (category.children && category.children.length > 0) {
                selectors.push(
                    <SearchableSelect
                        key={`level-${index + 1}`}
                        level={index + 1}
                        options={category.children}
                        value={selectedPath[index + 1]?.id || null}
                        onChange={(id) => handleSelect(index + 1, id)}
                        placeholder={`Select Sub Category of ${category.name}`}
                    />
                );
            }
        });

        return selectors;
    };

    return (
        <div className={styles.wrapper}>
            {renderSelectors()}
            {selectedPath.length > 0 && (
                <div className={styles.summary}>
                    Selected: <strong>{selectedPath[selectedPath.length - 1].name}</strong>
                    <button 
                        type="button" 
                        onClick={() => { setSelectedPath([]); onSelect(0); }} 
                        className={styles.resetBtn}
                    >
                        <X size={12} /> Clear
                    </button>
                </div>
            )}
        </div>
    );
}