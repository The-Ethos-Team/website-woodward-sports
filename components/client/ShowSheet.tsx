'use client';
/* Show sheet: one show per "channel", surf between them with the arrows, the keyboard or a swipe. */
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLive, useSchedule } from '@/lib/live/store';
import { hostsOf, pad } from '@/lib/live/compute';
import { bus, register } from '@/lib/ui/bus';
import { pull, push } from '@/lib/ui/dialogs';
import { motion, surf, vibrate } from '@/lib/ui/motion';
import { Arrow, Dot, Icon, NewTab } from '@/components/ui/bits';
import { placementOf, track } from '@/components/client/Analytics';

export function ShowSheet() {
  const S = useSchedule();
  const n = useLive();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [idx, setIdx] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const xBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const idxRef = useRef(0);
  const N = S.shows.length;

  const close = useCallback((returnFocus = true) => {
    if (!root.current) return;
    setShown(false);
    pull(root.current);
    setTimeout(() => setOpen(o => (root.current?.classList.contains('is-open') ? o : false)), motion.rm ? 160 : 430);
    if (returnFocus && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  }, []);

  const openSheet = useCallback((i: number, op?: HTMLElement | null) => {
    opener.current = op ?? (document.activeElement as HTMLElement);
    const k = ((i % N) + N) % N;
    flushSync(() => setOpen(true));
    /* one steady height while paging: size the panel to the tallest show */
    const p = panel.current;
    if (p) {
      p.style.minHeight = '';
      let tall = 0;
      for (let j = 0; j < N; j++) { flushSync(() => setIdx(j)); tall = Math.max(tall, p.offsetHeight); }
      if (tall) p.style.minHeight = tall + 'px';
    }
    flushSync(() => setIdx(k));
    idxRef.current = k;
    track('show_open', { show_id: S.shows[k]?.id, placement: placementOf(op ?? null) });
    if (root.current) push({ el: root.current, close: () => close() });
    xBtn.current?.focus({ preventScroll: true });
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, [N, close, S.shows]);

  useEffect(() => register('openSheet', openSheet), [openSheet]);

  const surfTo = useCallback((dir: number) => {
    vibrate(8);
    const ni = (idxRef.current + dir + N) % N;
    idxRef.current = ni;
    track('show_surf', { show_id: S.shows[ni].id, direction: dir > 0 ? 'next' : 'prev' });
    surf(panel.current, () => flushSync(() => setIdx(ni)), `CH ${pad(ni + 1)} › ${S.shows[ni].name.toUpperCase()}`);
  }, [N, S]);

  /* swipe (touch) and mouse drag, horizontal only */
  const s0 = useRef<{ x: number; y: number; t: number } | null>(null);
  const end = (x: number, y: number, t: number) => {
    const a = s0.current;
    if (!a) return;
    const dx = x - a.x, dy = y - a.y, v = Math.abs(dx) / Math.max(1, t - a.t);
    s0.current = null;
    if ((Math.abs(dx) > 60 || (v > 0.5 && Math.abs(dx) > 20)) && Math.abs(dx) > 1.5 * Math.abs(dy)) surfTo(dx < 0 ? 1 : -1);
  };

  const s = S.shows[idx];
  const chip = n ? n.chips[idx] : 'later';
  const live = chip === 'live';
  const h = hostsOf(s);
  return (
    <div className={'sheet' + (shown ? ' is-open' : '')} id="show-sheet" role="dialog" aria-modal="true" aria-labelledby="ss-name" hidden={!open} ref={root}
      onKeyDown={e => { if (e.key === 'ArrowLeft') surfTo(-1); if (e.key === 'ArrowRight') surfTo(1); }}>
      <div className="sheet__backdrop" onClick={() => close()} />
      <div className="sheet__panel" data-surf="" ref={panel}
        onTouchStart={e => { const t = e.touches[0]; s0.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, t: e.timeStamp } : null; }}
        onTouchEnd={e => { const t = e.changedTouches[0]; end(t.clientX, t.clientY, e.timeStamp); }}
        onTouchCancel={() => { s0.current = null; }}
        onPointerDown={e => { if (e.pointerType === 'mouse' && !e.button && !(e.target as Element).closest('a, button')) s0.current = { x: e.clientX, y: e.clientY, t: e.timeStamp }; }}
        onPointerUp={e => { if (e.pointerType === 'mouse') end(e.clientX, e.clientY, e.timeStamp); }}>
        <span className="sheet__grip" aria-hidden="true" />
        <button className="ibtn sheet__x" type="button" aria-label="Close" ref={xBtn} onClick={() => close()}><Icon name="close" /></button>
        <div className="sheet__body" data-surf-content="">
          {open ? (
            <div className="ss" data-show={s.id} data-placement="show_sheet">
              <div className="ss__top">
                <img className="ss__art" src={s.artL} width={900} height={900} alt={`${s.name} show art`} />
                <div>
                  <p className="ss__ch">CH {pad(idx + 1)} · <span className="nw">{s.slotShort}</span></p>
                  <h2 className="ss__name" id="ss-name">{s.name}</h2>
                  <p className="ss__tag">{s.tagline}</p>
                  {h ? <p className="ss__hosts">{h}</p> : null}
                  <span className={'chip chip--' + chip}>{live ? <><Dot />Live now</> : chip}</span>
                </div>
              </div>
              <p className="ss__desc">{s.desc}</p>
              <div className="ss__ctas">
                <button className="btn btn--blade" type="button" onClick={() => { const op = opener.current; close(false); bus.openLive({ opener: op, video: live ? null : s.replay, from: 'sheet' }); }}>
                  <Icon name="play" /><span>{live ? 'Watch live' : 'Watch latest episode'}</span>
                </button>
                <a className="btn btn--ghost btn--sm" href={s.apple} target="_blank" rel="noopener"><Icon name="pod" /><span>Apple Podcasts</span><NewTab /></a>
                {s.spotify ? <a className="btn btn--ghost btn--sm" href={s.spotify} target="_blank" rel="noopener"><Icon name="spotify" /><span>Spotify</span><NewTab /></a> : null}
                <a className="pod__rss" href={s.rss} target="_blank" rel="noopener"><Icon name="rss" /><span>RSS</span><NewTab /></a>
              </div>
              <p className="ss__more"><Link className="textlink textlink--light" href={s.page} onClick={() => close(false)}>Episodes, hosts and stories<Arrow /></Link></p>
              <Link className="slot slot--sm" href="/advertise" data-slot={`show_sheet:${s.id}`} onClick={() => close(false)}><span className="slot__k">{s.short} presented by</span><span className="slot__v">Available</span></Link>
            </div>
          ) : null}
        </div>
        <div className="sheet__nav">
          <button className="rbtn" type="button" aria-label="Previous show" onClick={() => surfTo(-1)}><Icon name="chev-l" /></button>
          <span className="sheet__ch">CH {pad(idx + 1)} / {pad(N)}</span>
          <button className="rbtn" type="button" aria-label="Next show" onClick={() => surfTo(1)}><Icon name="chev-r" /></button>
        </div>
        <span className="osd" aria-hidden="true" data-osd="" />
        <span className="surf" aria-hidden="true"><i className="surf__scan" /><i className="surf__noise" /></span>
      </div>
    </div>
  );
}
