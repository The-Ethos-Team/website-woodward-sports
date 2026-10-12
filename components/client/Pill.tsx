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
    /* the next show's name where the header has room (desktop); the fit below drops it when the pill would truncate */
    const nm = <span className="pill__nm">· {s.short.toUpperCase()} </span>;
    if (n.state === 'live') txt = <>{pre('LIVE')}{s.short.toUpperCase()}</>;
    else if (n.state === 'next') txt = n.left <= 15 * 60000 ? <>STARTING SOON {nm}</> : <>UP NEXT {nm}<Num text={cd(n.left)} /></>;
    else txt = <>{pre('OFF AIR')}<Num text={backAt(n, S.shows, false)} /></>;
  }
  /* keep the pill text whole when the header runs out of room: drop the Find label first, then the header's ET
     clock, then the show name (UP NEXT), then "LIVE · ", and last tighten the pill's spacing ("BRAYLON EDWARDS"
     needs it at 375, 900 and 1100 px). Any overflow counts: a 1 px one already shows an ellipsis. */
  const txtRef = useRef<HTMLSpanElement>(null);
  const tkey = n ? (n.state === 'live' ? 'L' + n.i : n.state === 'next' ? (n.left <= 15 * 60000 ? 'S' + n.i : 'N' + n.i + cd(n.left).length) : 'O' + n.i) : '';
  const fit = () => {
    const t = txtRef.current, H = document.documentElement;
    if (!t) return;
    const over = () => t.scrollWidth > t.clientWidth;
    const steps = ['pill-nf', 'pill-nc', 'pill-nn', 'pill-np', 'pill-nt'];
    H.classList.remove(...steps);
    for (const c of steps) {
      if (!over()) break;
      H.classList.add(c);
    }
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
