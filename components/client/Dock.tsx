'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef, useState } from 'react';
import { useLive } from '@/lib/live/store';
import { useSection, under } from '@/lib/ui/section';
import { Icon } from '@/components/ui/bits';

const ITEMS = [
  { label: 'Shows', href: '/shows', icon: 'shows', secs: ['lineup'] },
  { label: 'Teams', href: '/teams', icon: 'teams', secs: ['teams', 'stories'] },
  null,
  { label: 'Listen', href: '/listen', icon: 'listen', secs: ['listen'] },
  { label: 'Shop', href: '/shop', icon: 'shop', secs: ['shop'] },
] as const;

/** Mobile dock (<900): Shows · Teams · [WATCH / LIVE] · Listen · Shop. */
export function Dock({ liveUrl }: { liveUrl: string }) {
  const path = usePathname();
  const sec = useSection();
  const live = useLive()?.state === 'live';
  const nav = useRef<HTMLElement>(null);
  const [bx, setBx] = useState<number | null>(null);
  const active = ITEMS.find(it => it && (path === '/' ? (it.secs as readonly string[]).includes(sec) : under(path, it.href) || (it.href === '/teams' && under(path, '/stories'))))?.href;

  useLayoutEffect(() => {
    const place = () => {
      const a = active ? nav.current?.querySelector<HTMLElement>(`a[href="${active}"]`) : null;
      setBx(a && a.offsetWidth ? a.offsetLeft + a.offsetWidth / 2 - 10 : null);
    };
    place();
    addEventListener('resize', place, { passive: true });
    return () => removeEventListener('resize', place);
  }, [active]);

  return (
    <nav className="dock" aria-label="Quick navigation" ref={nav}>
      {ITEMS.map(it =>
        it ? (
          <Link key={it.href} className={'dock__a' + (it.href === active ? ' is-on' : '')} href={it.href} aria-current={it.href === active && path === it.href ? 'page' : undefined}>
            <Icon name={it.icon} />
            <span className="dock__lbl">{it.label}</span>
          </Link>
        ) : (
          <a key="watch" className="dock__watch" href={liveUrl} target="_blank" rel="noopener" data-live-open="dock">
            <span className="dock__disc"><Icon name="play" /></span>
            <span className="dock__lbl">{live ? 'Live' : 'Watch'}</span>
            <span className="sr-only"> live</span>
          </a>
        ),
      )}
      <i className={'dock__bar' + (bx !== null ? ' is-on' : '')} aria-hidden="true" style={bx !== null ? { ['--bx' as string]: bx + 'px' } : undefined} />
    </nav>
  );
}
