'use client';
/* WSN Live Room: one YouTube player (live stream when a show is on, replays otherwise), facade first.
   Mounted in the root layout, so the minimized player keeps playing across client-side navigation. */
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { getLive, useLive, useSchedule } from '@/lib/live/store';
import { cd, firstHour, hostsOf, WD } from '@/lib/live/compute';
import { register, type LiveOpts } from '@/lib/ui/bus';
import { focusQuiet, pull, push } from '@/lib/ui/dialogs';
import { EC, EO, fitName, motion, mq, MQ, padX, play, SPRING } from '@/lib/ui/motion';
import { Dot, Icon } from '@/components/ui/bits';
import { Flaps } from './Flaps';

type Mode = 'live' | 'vod';

export function LiveRoom() {
  const S = useSchedule();
  const n = useLive();
  const [open, setOpen] = useState(false);
  const [mini, setMini] = useState(false);
  const [mode, setMode] = useState<Mode>('vod');
  const [vid, setVid] = useState(S.latest.id);
  const [tab, setTab] = useState<'live' | 'replays'>('live');
  const [frame, setFrame] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const mclose = useRef<HTMLButtonElement>(null);
  const expandBtn = useRef<HTMLButtonElement>(null);
  const minBtn = useRef<HTMLButtonElement>(null);
  const info = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLElement>(null);
  const st = useRef({ open: false, mini: false, opener: null as HTMLElement | null });

  const live = n?.state === 'live';
  const s = S.shows[n?.i ?? 0];
  const embed = mode === 'live' ? S.liveEmbed : S.vodEmbed.replace('{id}', vid);
  const posterThumb = mode === 'live' ? (live ? s.replayThumb : S.latest.thumb) : (S.videos.find(v => v.id === vid)?.thumb ?? S.latest.thumb);

  /* ---------------------------------------------------------------- mini player geometry */
  const miniRect = (L: DOMRect) => {
    const wide = mq(MQ.wide);
    const W = wide ? 400 : Math.round(L.width * 0.42), sc = W / L.width, h = L.height * sc;
    const dock = document.querySelector('.dock');
    const dh = dock && getComputedStyle(dock).display !== 'none' ? dock.getBoundingClientRect().height : 0;
    const right = innerWidth - (wide ? 24 : 12), bottom = innerHeight - dh - (wide ? 24 : 30);
    return { s: sc, x: right - W, y: bottom - h, W, h };
  };
  const miniClear = (m: { y: number } | null) => {
    const H = document.documentElement;
    if (m) H.style.setProperty('--mini-clear', Math.ceil(innerHeight - m.y) + 'px');
    H.classList.toggle('lr-mini', !!m);
  };
  const placeMclose = (m: { x: number; y: number; W: number }) => {
    if (mclose.current) mclose.current.style.transform = `translate(${Math.round(Math.min(m.x + m.W - 30, innerWidth - 50))}px,${Math.round(m.y - 20)}px)`;
  };

  /* ---------------------------------------------------------------- open / close / minimize */
  const close = useCallback((returnFocus = true) => {
    const c = st.current;
    if (!c.open) return;
    const wasMini = c.mini;
    setFrame(false);
    if (root.current) pull(root.current);
    const sh = sheet.current, pl = player.current;
    let a: Animation | null;
    if (wasMini) a = play(pl, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
    else if (motion.rm) a = play(sh, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
    else if (mq(MQ.tab)) a = play(sh, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px) scale(.98)' }], { duration: 240, easing: EC, fill: 'forwards' });
    else a = play(sh, [{ transform: sh?.style.transform || 'none' }, { transform: 'translateY(100%)' }], { duration: 320, easing: EC, fill: 'forwards' });
    c.open = false;
    c.mini = false;
    (a ? a.finished : Promise.resolve()).catch(() => {}).then(() => {
      a?.cancel();
      pl?.getAnimations?.().forEach(x => x.cancel());
      if (pl) pl.style.transform = '';
      if (sh) sh.style.transform = '';
      if (backdrop.current) backdrop.current.style.opacity = '';
      miniClear(null);
      setOpen(false);
      setMini(false);
    });
    if (returnFocus && !wasMini && c.opener?.isConnected) c.opener.focus({ preventScroll: true });
  }, []);

  const minimize = useCallback((fromRect?: DOMRect) => {
    const c = st.current, pl = player.current, sh = sheet.current;
    if (!c.open || c.mini || !pl || !sh) return;
    c.mini = true;
    const P = fromRect || pl.getBoundingClientRect();
    sh.getAnimations?.().forEach(a => a.cancel());
    sh.style.transform = '';
    pl.getAnimations?.().forEach(a => a.cancel());
    pl.style.transform = 'none';
    const L = pl.getBoundingClientRect(), m = miniRect(L);
    const to = `translate(${m.x - L.left}px,${m.y - L.top}px) scale(${m.s})`;
    pl.style.transform = to;
    play(pl, [{ transform: `translate(${P.left - L.left}px,${P.top - L.top}px) scale(${P.width / L.width})` }, { transform: to }], { duration: motion.rm ? 1 : 420, easing: EO });
    if (backdrop.current) backdrop.current.style.opacity = '';
    if (root.current) pull(root.current);
    flushSync(() => setMini(true));
    placeMclose(m);
    miniClear(m);
    expandBtn.current?.focus({ preventScroll: true });
  }, []);

  const expand = useCallback(() => {
    const c = st.current, pl = player.current;
    if (!c.mini || !pl || !root.current) return;
    c.mini = false;
    const from = pl.style.transform;
    pl.style.transform = '';
    play(pl, [{ transform: from }, { transform: 'none' }], { duration: motion.rm ? 1 : 420, easing: EO });
    miniClear(null);
    push({ el: root.current, close: () => close() });
    flushSync(() => setMini(false));
    setTimeout(() => focusQuiet(minBtn.current), 60);
  }, [close]);

  const openLive = useCallback(({ from = 'btn', video = null, opener = null }: LiveOpts = {}) => {
    const c = st.current, n0 = getLive(), isLive = n0?.state === 'live';
    if (c.open && c.mini) expand();
    const m: Mode = video ? 'vod' : isLive ? 'live' : 'vod';
    flushSync(() => {
      setMode(m);
      setVid(video ?? S.latest.id);
      setTab(m === 'live' ? 'live' : 'replays');
    });
    if (c.open) { setFrame(true); return; }
    c.open = true;
    c.opener = opener || (document.activeElement as HTMLElement);
    flushSync(() => setOpen(true));
    if (root.current) push({ el: root.current, close: () => close() });
    const sh = sheet.current, pl = player.current;
    const fade = [root.current?.querySelector('.lr__bg'), root.current?.querySelector('.lr__handle'), info.current];
    const facade = document.getElementById('facade') as (HTMLElement & { _vis?: boolean }) | null;
    let a: Animation | null;
    if (motion.rm) a = play(sh, [{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    else if (from === 'facade' && facade && facade.getClientRects().length && facade._vis !== false && pl) {
      const L = pl.getBoundingClientRect(), F = facade.getBoundingClientRect();
      a = play(pl, [{ transform: `translate(${F.left - L.left}px,${F.top - L.top}px) scale(${F.width / L.width})` }, { transform: 'none' }], { duration: 480, easing: EO });
      fade.forEach(el => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 160, easing: 'ease-out', fill: 'backwards' }));
    } else if (mq(MQ.tab)) a = play(sh, [{ opacity: 0, transform: 'translateY(24px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EO });
    else a = play(sh, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 420, easing: EO });
    (a ? a.finished : Promise.resolve()).catch(() => {}).then(() => { if (st.current.open) setFrame(true); });
    setTimeout(() => focusQuiet(minBtn.current), 60);
  }, [S, close, expand]);

  useEffect(() => register('openLive', openLive), [openLive]);

  /* delegated openers: [data-live-open] buttons/links and video cards anywhere on the page */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      const t = e.target as Element;
      const a = t.closest<HTMLElement>('[data-live-open]');
      if (a) {
        e.preventDefault();
        const from = (a.dataset.liveOpen || 'btn') as LiveOpts['from'];
        const ln = getLive(), isLive = ln?.state === 'live';
        /* facade: the replay unless a show is live · show pages: live only when that show is on air */
        const video = (from === 'facade' && !isLive) || (from === 'show' && !(isLive && S.shows[ln!.i].id === a.dataset.show)) ? a.dataset.video ?? null : null;
        openLive({ from, video, opener: a });
        return;
      }
      const v = t.closest<HTMLElement>('a.vcard[data-video]');
      if (v) { e.preventDefault(); openLive({ video: v.dataset.video, opener: v }); }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [openLive, S]);

  /* keep the mini player docked on resize */
  useEffect(() => {
    const on = () => {
      const pl = player.current;
      if (!st.current.mini || !pl) return;
      pl.style.transform = 'none';
      const L = pl.getBoundingClientRect(), m = miniRect(L);
      pl.style.transform = `translate(${m.x - L.left}px,${m.y - L.top}px) scale(${m.s})`;
      placeMclose(m);
      miniClear(m);
    };
    addEventListener('resize', on);
    return () => removeEventListener('resize', on);
  }, []);

  /* drag the handle or the now-playing plate down to minimize (never the iframe) */
  const drag = useRef<{ y0: number; last: number; t: number; v: number; dy: number } | null>(null);
  const dragHandlers = {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (st.current.mini || (e.pointerType === 'mouse' && e.button) || (e.target as Element).closest('button, a')) return;
      drag.current = { y0: e.clientY, last: e.clientY, t: e.timeStamp, v: 0, dy: 0 };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const g = drag.current;
      if (!g || !sheet.current) return;
      let dy = e.clientY - g.y0;
      if (dy < 0) dy *= 0.3;
      const dt = Math.max(1, e.timeStamp - g.t);
      g.v = (e.clientY - g.last) / dt; g.last = e.clientY; g.t = e.timeStamp; g.dy = dy;
      sheet.current.style.transform = `translateY(${dy}px)`;
      if (backdrop.current) backdrop.current.style.opacity = String(Math.max(0, 0.96 * (1 - Math.max(0, dy) / innerHeight)));
    },
    onPointerUp: () => endDrag(),
    onPointerCancel: () => endDrag(),
  };
  function endDrag() {
    const g = drag.current;
    if (!g) return;
    drag.current = null;
    if (g.dy > innerHeight * 0.25 || (g.v > 0.5 && g.dy > 24)) minimize(player.current?.getBoundingClientRect());
    else if (sheet.current) {
      const from = sheet.current.style.transform;
      sheet.current.style.transform = '';
      if (backdrop.current) backdrop.current.style.opacity = '';
      if (from) play(sheet.current, [{ transform: from }, { transform: 'none' }], { duration: 300, easing: SPRING });
    }
  }

  /* Anton name fits the plate */
  const plateName = mode === 'live' ? (live ? s.name : 'Woodward Sports Network') : (S.shows.find(x => x.id === S.videos.find(v => v.id === vid)?.show)?.name ?? 'Woodward Sports');
  useLayoutEffect(() => {
    const b = nameRef.current, plate = b?.parentElement;
    if (!open || !b || !plate || !plate.getClientRects().length) return;
    fitName(b, plate.parentElement!.clientWidth - padX(plate));
  }, [open, plateName]);

  /* plate, message */
  const v = S.videos.find(x => x.id === vid) ?? S.videos[0];
  let kick: React.ReactNode, hostsLine: string;
  if (mode === 'live') {
    kick = live ? <><Dot />LIVE NOW · {s.slotShort}</> : 'WSN LIVE STREAM';
    hostsLine = live ? hostsOf(s) : 'Live shows every weekday · 8AM–7PM ET';
  } else {
    kick = 'REPLAY · ' + (v?.meta.split('·').pop()?.trim().toUpperCase() ?? '');
    hostsLine = v?.title ?? '';
  }
  const msg = !n ? null : live ? (
    <><b>{s.name}</b> is live right now with {hostsOf(s)}.</>
  ) : n.state === 'next' ? (
    <>Up next: <b>{s.name}</b> at {firstHour(s)}. Starts in</>
  ) : (
    <>We’re off air. Back <b>{WD[n.wd ?? 1]} {firstHour(s)}</b> with <b>{s.name}</b>.</>
  );

  const cls = 'lr' + (open ? ' is-open' : '') + (mini ? ' is-mini' : '') + (live ? ' is-live' : '');
  return (
    <div className={cls} id="liveroom" role="dialog" aria-modal={mini ? 'false' : 'true'} aria-labelledby="lr-title" hidden={!open} ref={root}>
      <div className="lr__backdrop" ref={backdrop} onClick={() => close()} />
      <div className="lr__sheet" ref={sheet}>
        <div className="lr__bg" aria-hidden="true" />
        <div className="lr__handle" {...dragHandlers}>
          <span className="lr__grip" aria-hidden="true" />
          <h2 className="lr__title" id="lr-title">WSN Live Room</h2>
          <button className="ibtn" type="button" aria-label="Minimize player" ref={minBtn} onClick={() => minimize()}><Icon name="chev-d" /></button>
          <button className="ibtn" type="button" aria-label="Close Live Room" onClick={() => close()}><Icon name="close" /></button>
        </div>
        <div className="lr__player" ref={player}>
          <div className="lr__frame">
            {open ? <img className="lr__poster" src={posterThumb.md} width={1280} height={720} alt="" decoding="async" /> : null}
            {open && frame ? (
              <iframe title="Woodward Sports Network player" src={embed} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
            ) : null}
          </div>
          <button className="lr__expand" type="button" hidden={!mini} ref={expandBtn} onClick={expand}><span className="sr-only">Expand player</span></button>
        </div>
        <div className="lr__info" ref={info}>
          <div className="lr__now" {...dragHandlers}>
            <div className="lr__l3 blade">
              <span className="lr__kick">{kick}</span>
              <b ref={nameRef} data-fit="">{plateName}</b>
              <span className="lr__hosts">{hostsLine}</span>
            </div>
          </div>
          <div className="tabs" role="tablist" aria-label="Live Room"
            onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const t = tab === 'live' ? 'replays' : 'live'; setTab(t); if (t === 'live') { setMode('live'); setFrame(true); } (e.currentTarget.querySelector(`[data-lr-tab="${t}"]`) as HTMLElement | null)?.focus(); } }}>
            <button className="tab" type="button" role="tab" id="lr-tab-live" aria-controls="lr-p-live" aria-selected={tab === 'live'} tabIndex={tab === 'live' ? 0 : -1} data-lr-tab="live"
              onClick={() => { setTab('live'); setMode('live'); setFrame(true); }}><i className="tab__dot" />Live</button>
            <button className="tab" type="button" role="tab" id="lr-tab-rep" aria-controls="lr-p-rep" aria-selected={tab === 'replays'} tabIndex={tab === 'replays' ? 0 : -1} data-lr-tab="replays"
              onClick={() => setTab('replays')}>Replays</button>
          </div>
          <div className="lr__panel" role="tabpanel" id="lr-p-live" aria-labelledby="lr-tab-live" hidden={tab !== 'live'}>
            <p className="lr__msg">
              {msg}
              {n && !live ? <Flaps key={n.state + n.i} value={cd(n.left)} animate={open && !mini} /> : null}
            </p>
            <div className="lr__acts">
              <button className="btn btn--ghost btn--sm" type="button"
                onClick={() => { const id = live ? s.replay : S.latest.id; setTab('replays'); setMode('vod'); setVid(id); setFrame(true); }}>
                <Icon name="play" /><span>Latest replay</span>
              </button>
              <a className="btn btn--ghost btn--sm" href={s.apple} target="_blank" rel="noopener"><Icon name="listen" /><span>Listen instead</span><span className="sr-only"> (Apple Podcasts, opens in new tab)</span></a>
            </div>
          </div>
          <div className="lr__panel" role="tabpanel" id="lr-p-rep" aria-labelledby="lr-tab-rep" hidden={tab !== 'replays'}>
            <ul className="lr__list">
              {S.videos.map(x => (
                <li key={x.id}>
                  <button className={'lr__vid' + (mode === 'vod' && x.id === vid ? ' is-playing' : '')} type="button"
                    onClick={() => { setMode('vod'); setVid(x.id); setFrame(true); info.current?.scrollTo({ top: 0, behavior: motion.rm ? 'auto' : 'smooth' }); }}>
                    {open ? <img src={x.thumb.sm} width={480} height={270} alt="" loading="lazy" decoding="async" /> : null}
                    <span><b>{x.title}</b><small>{x.meta}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Link className="slot slot--sm" href="/advertise" onClick={() => close(false)}>
            <span className="slot__k">Live Room presented by</span><span className="slot__v">Available</span>
          </Link>
        </div>
      </div>
      <button className="lr__mclose" type="button" hidden={!mini} aria-label="Close player" ref={mclose} onClick={() => close()}><Icon name="close" /></button>
    </div>
  );
}

