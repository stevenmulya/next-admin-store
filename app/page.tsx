"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard'); // Middleware akan otomatis lempar ke /login jika belum auth
  }, [router]);

  return null; // Tidak merender apa-apa
}