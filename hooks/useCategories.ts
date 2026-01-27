import { useState, useEffect } from 'react';
import api from '@/services/api';

interface Category {
    id: number;
    name: string;
    children: Category[];
}

export const useCategoryTree = () => {
    const [tree, setTree] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTree = async () => {
        try {
            const { data } = await api.get('/categories');
            setTree(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTree();
    }, []);

    return { tree, isLoading, refresh: fetchTree };
};