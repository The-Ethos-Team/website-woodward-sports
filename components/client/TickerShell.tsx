'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/bits';
import { useInView } from './hooks';

/** Ticker frame: pause button (WCAG 2.2.2), speed from the list width (90 px/s), paused off-screen. While a headline
    has keyboard focus the crawl stops and becomes a scrollable strip that keeps the focused link in view (WCAG
    2.4.11, see .ticker__view:focus-within in globals.css). */
export function TickerShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  /* the strip is laid out still a frame after focus arrives: then bring the focused link into the middle */
  const reveal = (el: HTMLElement) => requestAnimationFrame(() => {
    const v = view.current;
    if (!v || !v.contains(el) || document.activeElement !== el) return;
    const vr = v.getBoundingClientRect(), r = el.getBoundingClientRect();
    v.scrollLeft += r.left - vr.left - Math.max(0, (vr.width - r.width) / 2);
  });
  const [paused, setPaused] = useState(false);
  const vis = useInView(root);
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    const set = () => {
      const list = t.querySelector<HTMLElement>('.ticker__list');
      if (list) t.style.setProperty('--tk-dur', (list.offsetWidth / 90).toFixed(1) + 's');
    };
    set();
    document.fonts?.ready.then(set);
    const ro = new ResizeObserver(set);
    ro.observe(t);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={root} className={'ticker' + (paused ? ' is-paused' : '') + (vis ? '' : ' is-off')} role="region" aria-label="Headline ticker" data-ticker="">
      <button className="ticker__pause" type="button" aria-pressed={paused} onClick={() => setPaused(p => !p)}>
        <span className="sr-only">{paused ? 'Play ticker' : 'Pause ticker'}</span>
        <Icon name="pause" cls="ico ico--pause" />
        <Icon name="play" cls="ico ico--play" />
      </button>
      <div className="ticker__view" ref={view}
        onFocus={e => reveal(e.target as HTMLElement)}
        onBlur={e => { if (!view.current?.contains(e.relatedTarget as Node | null) && view.current) view.current.scrollLeft = 0; }}>
        <div className="ticker__track" ref={track}>{children}</div>
      </div>
    </div>
  );
}
