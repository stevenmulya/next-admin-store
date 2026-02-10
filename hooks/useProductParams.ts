import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export const useProductParams = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const categoryId = searchParams.get('category_id') || 'all';

  const updateParams = (key: string, value: string | number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (key !== 'page') {
      params.set('page', '1');
    }

    if (value && value !== 'all') {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }

    replace(`${pathname}?${params.toString()}`);
  };

  return {
    page,
    search,
    sort,
    categoryId,
    setPage: (p: number) => updateParams('page', p),
    setSort: (s: string) => updateParams('sort', s),
    setCategory: (c: string) => updateParams('category_id', c),
  };
};