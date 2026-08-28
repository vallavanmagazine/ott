/**
 * Dropdown options sourced from the admin-managed `content_categories` table.
 *
 * `value` is the stable category KEY (what content rows store, and what the
 * genre_type enum constrains); `label` is the renameable display name. Falls
 * back to the hard-coded list whenever the table is empty or unreachable, so a
 * form never renders an empty select.
 */
import { useEffect, useState } from 'react';
import { fetchAllCategories, type CategorySection } from '@/services/categories';
import { ALL_GENRES, CONTENT_TYPES } from '@/lib/admin-options';

export interface Option {
  value: string;
  label: string;
}

function fallbackFor(section: CategorySection): Option[] {
  const list = section === 'feed' ? CONTENT_TYPES : ALL_GENRES;
  return list.map((v) => ({ value: v, label: v }));
}

export function useCategoryOptions(section: CategorySection, restrictTo?: readonly string[]): Option[] {
  const [options, setOptions] = useState<Option[]>(() => {
    const base = fallbackFor(section);
    return restrictTo ? base.filter((o) => restrictTo.includes(o.value)) : base;
  });

  useEffect(() => {
    let cancelled = false;
    fetchAllCategories(section)
      .then((cats) => {
        if (cancelled) return;
        const live = cats
          .filter((c) => c.isActive)
          .filter((c) => !restrictTo || restrictTo.includes(c.name))
          .map((c) => ({ value: c.name, label: c.displayName || c.name }));
        if (live.length > 0) setOptions(live);
      })
      .catch(() => { /* keep the fallback */ });
    return () => { cancelled = true; };
    // restrictTo is a module-level constant array at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return options;
}
