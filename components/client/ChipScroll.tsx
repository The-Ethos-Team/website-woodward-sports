'use client';
import { useEffect } from 'react';

/** Scrolls the active filter chip into view in a static (link) chip strip. */
export function ChipScroll({ active }: { active: string }) {
  useEffect(() => {
    const strip = document.querySelector<HTMLElement>('.fchips--static'), on = strip?.querySelector<HTMLElement>('.is-on');
    if (strip && on) strip.scrollLeft = Math.max(0, on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2);
  }, [active]);
  return null;
}
