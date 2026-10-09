'use client';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/bits';
import { motion } from '@/lib/ui/motion';

/** Prev/next buttons (≥900) for a horizontal scroll-snap rail, by id. */
export function RailNav({ rail, label = 'videos' }: { rail: string; label?: string }) {
  const [at, setAt] = useState<{ start: boolean; end: boolean }>({ start: true, end: false });
  useEffect(() => {
    const el = document.getElementById(rail);
    if (!el) return;
    const upd = () => requestAnimationFrame(() => {
      const max = el.scrollWidth - el.clientWidth - 2;
      setAt({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max });
    });
    upd();
    el.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd, { passive: true });
    return () => { el.removeEventListener('scroll', upd); removeEventListener('resize', upd); };
  }, [rail]);
  const step = (dir: number) => {
    const el = document.getElementById(rail);
    if (!el) return;
    const it = el.querySelector<HTMLElement>(':scope > li'), cs = getComputedStyle(el), gap = parseFloat(cs.columnGap) || 0;
    const per = it ? Math.max(1, Math.round((el.clientWidth - parseFloat(cs.paddingLeft) * 2 + gap) / (it.offsetWidth + gap))) : 1;
    el.scrollBy({ left: dir * (it ? (it.offsetWidth + gap) * per : el.clientWidth), behavior: motion.rm ? 'auto' : 'smooth' });
  };
  return (
    <div className="railnav">
      <button className="rbtn" type="button" aria-label={`Previous ${label}`} disabled={at.start} onClick={() => step(-1)}><Icon name="chev-l" /></button>
      <button className="rbtn" type="button" aria-label={`Next ${label}`} disabled={at.end} onClick={() => step(1)}><Icon name="chev-r" /></button>
    </div>
  );
}
