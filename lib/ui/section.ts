'use client';
/* The home-page section in view (for the header marker and the dock bar). Boot feeds it from an IntersectionObserver. */
import { useSyncExternalStore } from 'react';

let current = '';
const subs = new Set<() => void>();
export function setSection(id: string) {
  if (id === current) return;
  current = id;
  subs.forEach(f => f());
}
export function useSection() {
  return useSyncExternalStore(
    f => { subs.add(f); return () => { subs.delete(f); }; },
    () => current,
    () => '',
  );
}

/** "/shows/crunch-time" is under "/shows"; "/watch-parties" is not under "/watch". */
export const under = (path: string, href: string) => path === href || path.startsWith(href + '/');
