'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NAV } from '@/lib/config';
import { useSection, under } from '@/lib/ui/section';
import { bus } from '@/lib/ui/bus';
import { Icon } from '@/components/ui/bits';
import { EtClock } from './EtClock';
import { Pill } from './Pill';

export function Header({ liveUrl }: { liveUrl: string }) {
  const path = usePathname();
  const sec = useSection();
  const nav = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);
  const [mx, setMx] = useState<number | null>(null);

  useEffect(() => {
    let tick = false;
    const on = () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => { setSolid(scrollY > 24); tick = false; });
    };
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);

  const active = path === '/' ? NAV.find(l => l.sec === sec)?.href : NAV.find(l => under(path, l.href))?.href;

  useLayoutEffect(() => {
    const place = () => {
      const l = active ? nav.current?.querySelector<HTMLElement>(`a[href="${active}"]`) : null;
      setMx(l && l.offsetWidth ? l.offsetLeft + (l.offsetWidth - 30) / 2 : null);
    };
    place();
    document.fonts?.ready.then(place);
    addEventListener('resize', place, { passive: true });
    return () => removeEventListener('resize', place);
  }, [active]);

  return (
    <header className={'hdr' + (solid ? ' is-solid' : '')} data-hdr="">
      <div className="hdr__in">
        <Link className="hdr__logo" href="/" aria-label="Woodward Sports Network, home">
          <img src="/img/logo.svg" width={40} height={40} alt="" />
        </Link>
        <nav className="hdr__nav" aria-label="Primary" ref={nav}>
          <ul>
            {NAV.map(l => {
              const on = l.href === active;
              return (
                <li key={l.href}>
                  <Link href={l.href} className={on ? 'is-on' : undefined} aria-current={on ? (path === l.href ? 'page' : 'true') : undefined}>{l.label}</Link>
                </li>
              );
            })}
          </ul>
          <span className={'hdr__mark' + (mx !== null ? ' is-on' : '')} aria-hidden="true" style={mx !== null ? { ['--mx' as string]: mx + 'px' } : undefined}>
            <i /><i /><i /><i /><i />
          </span>
        </nav>
        <EtClock />
        <Pill />
        <button className="hdr__find" type="button" onClick={e => bus.openFind(e.currentTarget)} aria-keyshortcuts="Meta+K Control+K /" data-find-open="">
          <Icon name="search" />
          <span className="hdr__findl">Find</span>
          <kbd>⌘K</kbd>
          <span className="sr-only">: shows, teams, stories, videos</span>
        </button>
        <a className="btn btn--blade hdr__watch" href={liveUrl} target="_blank" rel="noopener" data-live-open="">
          <Icon name="play" />
          <span>Watch Live</span>
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      </div>
      <span className="hdr__prog" aria-hidden="true" />
    </header>
  );
}
