'use client';
/* Site menu for phones and tablets (<1100 px, where the header has no room for the nav): every page, the teams,
   and search. The dock keeps the five quick links; this is the full map. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { TEAM, TEAM_IDS } from '@/lib/config';
import { bus, register } from '@/lib/ui/bus';
import { focusQuiet, pull, push } from '@/lib/ui/dialogs';
import { motion } from '@/lib/ui/motion';
import { under } from '@/lib/ui/section';
import { Icon } from '@/components/ui/bits';

const PAGES = [
  { href: '/shows', label: 'Shows', sub: 'The weekday lineup, 8 AM–7 PM ET' },
  { href: '/teams', label: 'Teams', sub: 'Lions, Pistons, Tigers, Red Wings, Michigan, MSU' },
  { href: '/stories', label: 'Stories', sub: 'The latest from the newsroom' },
  { href: '/watch', label: 'Watch', sub: 'Live Room, full episodes and Shorts' },
  { href: '/listen', label: 'Listen', sub: 'All four shows as podcasts' },
  { href: '/watch-parties', label: 'Watch parties', sub: 'Fan events around Detroit' },
  { href: '/shop', label: 'Shop', sub: 'Woodward Sports gear' },
  { href: '/app', label: 'App', sub: 'WSN Live! for iPhone' },
  { href: '/advertise', label: 'Advertise', sub: 'Put your brand on air' },
] as const;

export function Menu() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLAnchorElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback((returnFocus = true) => {
    if (!root.current || root.current.hidden) return;
    setShown(false);
    pull(root.current);
    setTimeout(() => setOpen(o => (root.current?.classList.contains('is-open') ? o : false)), motion.rm ? 160 : 360);
    if (returnFocus && opener.current?.isConnected) focusQuiet(opener.current);
  }, []);

  const openMenu = useCallback((op?: HTMLElement | null) => {
    opener.current = op ?? document.querySelector<HTMLElement>('[data-menu-open]');
    flushSync(() => setOpen(true));
    if (root.current) push({ el: root.current, close: () => close() });
    focusQuiet(first.current);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, [close]);

  useEffect(() => register('openMenu', openMenu), [openMenu]);
  /* a link was followed: close without stealing focus back to the menu button */
  useEffect(() => { close(false); }, [path, close]);

  return (
    <div className={'menu' + (shown ? ' is-open' : '')} id="menu" role="dialog" aria-modal="true" aria-labelledby="menu-h" hidden={!open} ref={root}>
      <div className="menu__backdrop" onClick={() => close()} />
      <div className="menu__panel">
        <div className="menu__bar">
          <h2 className="menu__h" id="menu-h">Menu</h2>
          <button className="menu__find" type="button" onClick={() => { close(false); bus.openFind(document.querySelector<HTMLElement>('[data-find-open]')); }}>
            <Icon name="search" /><span>Find</span>
          </button>
          <button className="ibtn" type="button" aria-label="Close menu" onClick={() => close()}><Icon name="close" /></button>
        </div>
        <div className="menu__body">
          <nav aria-label="All pages">
            <ul className="menu__list">
              <li>
                <Link className={'menu__a' + (path === '/' ? ' is-on' : '')} href="/" aria-current={path === '/' ? 'page' : undefined} ref={first}>
                  <b>Home</b><span>What’s on air right now</span>
                </Link>
              </li>
              {PAGES.map(p => {
                const on = under(path, p.href);
                return (
                  <li key={p.href}>
                    <Link className={'menu__a' + (on ? ' is-on' : '')} href={p.href} aria-current={on ? (path === p.href ? 'page' : 'true') : undefined}>
                      <b>{p.label}</b><span>{p.sub}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <p className="menu__lbl" id="menu-teams">Teams</p>
          <ul className="menu__teams" aria-labelledby="menu-teams">
            {TEAM_IDS.map(t => (
              <li key={t}>
                <Link className={'fx' + (path === `/teams/${t}` ? ' is-on' : '')} href={`/teams/${t}`} style={{ ['--team' as string]: TEAM[t].color }}><i />{TEAM[t].big}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
