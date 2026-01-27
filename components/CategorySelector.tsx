"use client";

import React, { useState, useEffect } from 'react';
import styles from './CategorySelector.module.css';

interface Category {
    id: number;
    name: string;
    children?: Category[];
}

interface Props {
    tree: Category[];
    onSelect: (categoryId: number | null) => void;
    initialId?: number;
}

export default function CategorySelector({ tree, onSelect, initialId }: Props) {
    const [selections, setSelections] = useState<number[]>([]);

    const findPath = (nodes: Category[], targetId: number, path: number[] = []): number[] | null => {
        for (const node of nodes) {
            if (node.id === targetId) return [...path, node.id];
            if (node.children) {
                const found = findPath(node.children, targetId, [...path, node.id]);
                if (found) return found;
            }
        }
        return null;
    };

    useEffect(() => {
        if (initialId && tree.length > 0) {
            const path = findPath(tree, initialId);
            if (path) setSelections(path);
        }
    }, [initialId, tree]);

    const handleDropdownChange = (level: number, id: number) => {
        const newSelections = selections.slice(0, level);
        if (id !== -1) {
            newSelections.push(id);
            onSelect(id);
        } else {
            const parentId = newSelections[level - 1] || null;
            onSelect(parentId);
        }
        setSelections(newSelections);
    };

    const renderDropdowns = () => {
        const dropdowns = [];
        let currentOptions = tree;

        dropdowns.push(
            <div key="level-0" className={styles.group}>
                <select
                    className={styles.select}
                    value={selections[0] || -1}
                    onChange={(e) => handleDropdownChange(0, Number(e.target.value))}
                >
                    <option value={-1}>Select Category...</option>
                    {tree.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
        );

        selections.forEach((selectedId, index) => {
            const selectedNode = currentOptions.find(n => n.id === selectedId);
            if (selectedNode && selectedNode.children && selectedNode.children.length > 0) {
                currentOptions = selectedNode.children;
                dropdowns.push(
                    <div key={`level-${index + 1}`} className={styles.group}>
                        <select
                            className={styles.select}
                            value={selections[index + 1] || -1}
                            onChange={(e) => handleDropdownChange(index + 1, Number(e.target.value))}
                        >
                            <option value={-1}>Select Sub-Category...</option>
                            {currentOptions.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                );
            }
        });

        return dropdowns;
    };

    return <div className={styles.container}>{renderDropdowns()}</div>;
}