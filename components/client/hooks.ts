'use client';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { keyOf, type LiveState } from '@/lib/live/compute';
import { canSurf, surf } from '@/lib/ui/motion';

/** true while the element is within 80 px of the viewport (pauses continuous animations off-screen). */
export function useInView(ref: RefObject<Element | null>, margin = '80px 0px') {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      setVis(e.isIntersecting);
      (el as Element & { _vis?: boolean })._vis = e.isIntersecting;
    }), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return vis;
}

export function useMedia(q: string, initial = false) {
  const [m, setM] = useState(initial);
  useEffect(() => {
    const mm = matchMedia(q);
    const on = () => setM(mm.matches);
    on();
    mm.addEventListener('change', on);
    return () => mm.removeEventListener('change', on);
  }, [q]);
  return m;
}

/** Live state as displayed: when the show changes, keep the old state on screen while the channel-surf
    animation plays out, then swap (flushSync) and play it in. */
export function useSurfed(n: LiveState | null, box: RefObject<HTMLElement | null>, osd?: (n: LiveState) => string) {
  const [frozen, setFrozen] = useState<LiveState | null>(null);
  const last = useRef<LiveState | null>(null);
  useLayoutEffect(() => {
    if (!n) return;
    const prev = last.current;
    last.current = n;
    if (prev && keyOf(prev) !== keyOf(n) && canSurf(box.current)) {
      setFrozen(prev);
      surf(box.current, () => flushSync(() => setFrozen(null)), osd?.(n));
    }
  }, [n, box, osd]);
  return frozen ?? n;
}
