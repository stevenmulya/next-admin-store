"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Login ke Backend
            const { data } = await api.post('/users/login', formData);
            
            // Jika sukses, simpan data ke Context & Cookies
            // data.token & data (user info) didapat dari response backend userController
            login(data.token, {
                id: data._id,
                name: data.name,
                email: data.email,
                isAdmin: data.isAdmin
            });
            
            toast.success('Login Successful!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
                    <p className="text-gray-500 text-sm">Sign in to manage your store</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Input 
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                    />
                    
                    <Input 
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                    />

                    <div className="mt-6">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </div>
                </form>

                <div className="mt-4 text-center text-sm text-gray-500">
                    <p>Default Admin: admin@example.com / 123456</p>
                    <p>(Register via Swagger/Postman first)</p>
                </div>
            </div>
        </div>
    );
}