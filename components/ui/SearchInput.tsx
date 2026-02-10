"use client";

import { Search } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export const SearchInput = ({ placeholder = "Search..." }: { placeholder?: string }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    
    setTimeout(() => {
        replace(`${pathname}?${params.toString()}`);
    }, 500); 
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
      <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('search')?.toString()}
        style={{
          width: '100%', padding: '14px 14px 14px 46px', border: '1px solid var(--border-color)',
          borderRadius: '12px', fontSize: '14px', outline: 'none', background: 'var(--bg-page)',
          color: 'var(--text-main)', transition: 'all 0.2s', boxSizing: 'border-box',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}
      />
    </div>
  );
};