'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/components/ui/bits';
import { useInView } from './hooks';

/** Ticker frame: pause button (WCAG 2.2.2), speed from the list width (90 px/s), paused off-screen. */
export function TickerShell({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
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
      <div className="ticker__view">
        <div className="ticker__track" ref={track}>{children}</div>
      </div>
    </div>
  );
}
