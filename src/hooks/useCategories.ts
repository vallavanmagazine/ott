import { useEffect, useState } from 'react';
import { fetchCategoryNames, type CategorySection } from '@/services/categories';

/**
 * Active category display-names (English) for a section, from content_categories
 * (FIX 2). Falls back to the provided defaults until/if the table is empty.
 */
export function useCategoryNames(section: CategorySection, fallback: string[]): string[] {
  const [names, setNames] = useState<string[]>(fallback);
  useEffect(() => {
    let active = true;
    fetchCategoryNames(section).then((n) => { if (active && n.length) setNames(n); });
    return () => { active = false; };
  }, [section]);
  return names;
}
