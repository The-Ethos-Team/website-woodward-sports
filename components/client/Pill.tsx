'use client';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLive, useSchedule } from '@/lib/live/store';
import { backAt, cd, stateLine } from '@/lib/live/compute';
import { bus } from '@/lib/ui/bus';
import { Num } from '@/components/ui/bits';
import { useSurfed } from './hooks';

/** ON AIR / UP NEXT / OFF AIR status pill (America/Detroit). Opens the Live Room while a show is live. */
export function Pill() {
  const S = useSchedule();
  const ref = useRef<HTMLAnchorElement>(null);
  const n = useSurfed(useLive(), ref);
  const pre = (t: string) => <span className="pill__pre">{t} · </span>;
  let txt: React.ReactNode = <>WEEKDAYS <span className="nw">8AM–7PM ET</span></>;
  if (n) {
    const s = S.shows[n.i];
    if (n.state === 'live') txt = <>{pre('LIVE')}{s.short.toUpperCase()}</>;
    else if (n.state === 'next') txt = n.left <= 15 * 60000 ? 'STARTING SOON' : <>UP NEXT <Num text={cd(n.left)} /></>;
    else txt = <>{pre('OFF AIR')}<Num text={backAt(n, S.shows, false)} /></>;
  }
  /* keep the pill text whole when the header runs out of room: drop the Find label first, then "LIVE · " */
  const txtRef = useRef<HTMLSpanElement>(null);
  const tkey = n ? (n.state === 'live' ? 'L' + n.i : n.state === 'next' ? (n.left <= 15 * 60000 ? 'S' : 'N' + cd(n.left).length) : 'O' + n.i) : '';
  const fit = () => {
    const t = txtRef.current, H = document.documentElement;
    if (!t) return;
    const over = () => t.scrollWidth > t.clientWidth + 1;
    H.classList.remove('pill-np', 'pill-nf');
    if (over()) H.classList.add('pill-nf');
    if (over()) H.classList.add('pill-np');
  };
  useLayoutEffect(fit, [tkey]);
  useEffect(() => {
    let tm: ReturnType<typeof setTimeout>;
    const on = () => { clearTimeout(tm); tm = setTimeout(fit, 120); };
    addEventListener('resize', on, { passive: true });
    document.fonts?.ready.then(fit);
    return () => { removeEventListener('resize', on); clearTimeout(tm); };
  }, []);
  const label = n ? stateLine(n, S.shows) + (n.state === 'live' ? ' Open the Live Room.' : ' See the lineup.') : undefined;
  return (
    <Link
      className="pill" href="/shows" ref={ref} data-pill="" data-surf="" data-state={n?.state} aria-label={label}
      onClick={e => { if (n?.state === 'live') { e.preventDefault(); bus.openLive({ opener: e.currentTarget }); } }}
    >
      <span className="pill__in" data-surf-content="">
        <i className="pill__dot" />
        <span className="pill__txt" ref={txtRef}>{txt}</span>
      </span>
    </Link>
  );
}
