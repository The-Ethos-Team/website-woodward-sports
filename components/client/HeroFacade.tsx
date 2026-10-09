'use client';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useLive, useSchedule } from '@/lib/live/store';
import { backAt, cd, endsIn, hostsOf, pad } from '@/lib/live/compute';
import { fitName, padX } from '@/lib/ui/motion';
import { Dot, Icon, Num } from '@/components/ui/bits';
import { VideoImg } from '@/components/ui/media';
import { Flaps } from './Flaps';
import { useInView, useSurfed } from './hooks';
import { useClockText } from './EtClock';

/** Hero player facade: bug, ET clock, lower-third with split-flap countdown; opens the Live Room. */
export function HeroFacade() {
  const S = useSchedule();
  const box = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const vis = useInView(box);
  const osd = useCallback((n: { i: number }) => `CH ${pad(n.i + 1)} › ${S.shows[n.i].name.toUpperCase()}`, [S]);
  const n = useSurfed(useLive(), box, osd);
  const clock = useClockText(true);

  const latestShow = S.shows.find(s => s.id === S.latest.show) ?? S.shows[0];
  const live = n?.state === 'live';
  const s = n ? S.shows[n.i] : latestShow;
  const soon = n?.state === 'next' && n.left <= 15 * 60000;

  let kick: React.ReactNode = 'LATEST EPISODE', lbl = 'STARTS IN';
  if (n) {
    if (live) { kick = <><Dot />LIVE NOW · {s.slotShort}</>; lbl = 'ENDS IN'; }
    else { kick = n.state === 'next' ? `${soon ? 'STARTING SOON' : 'UP NEXT'} · ${s.slotShort}` : `OFF AIR · ${backAt(n, S.shows, true)}`; lbl = n.state === 'next' ? 'STARTS IN' : 'BACK IN'; }
  }
  const thumb = live ? s.replayThumb : S.latest.thumb;
  const vid = live ? s.replay : S.latest.id;
  const href = live ? S.liveUrl : `https://www.youtube.com/watch?v=${S.latest.id}`;
  const label = !n ? `Play the latest episode: ${S.latest.title} (opens in new tab)` : live ? `Watch ${s.name} live now (opens in new tab)` : 'Play the latest replay in the Live Room';

  /* Anton name: shrink to fit the plate next to the countdown box */
  const fit = useCallback(() => {
    const name = nameRef.current;
    if (!name) return;
    const plate = name.parentElement!, l3 = plate.parentElement!, side = l3.querySelector<HTMLElement>('.l3__side');
    const inRow = side && !side.hidden && getComputedStyle(l3).flexDirection === 'row';
    fitName(name, l3.clientWidth - (inRow ? side.offsetWidth + 8 : 0) - padX(plate));
  }, []);
  useLayoutEffect(fit, [fit, s.name, n?.state, n ? cd(n.left).length : 0]);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = () => { clearTimeout(t); t = setTimeout(fit, 120); };
    addEventListener('resize', on, { passive: true });
    document.fonts?.ready.then(fit);
    return () => { removeEventListener('resize', on); clearTimeout(t); };
  }, [fit]);

  return (
    <div className={'facade' + (live ? ' is-live' : '') + (vis ? '' : ' is-off')} id="facade" data-surf="" ref={box}>
      <div className="facade__media" data-surf-content="">
        <VideoImg key={vid} thumb={thumb} className="facade__img" hero sizes="(min-width: 1100px) 600px, (min-width: 600px) calc(100vw - 48px), calc(100vw - 32px)" />
      </div>
      <span className="facade__shade" aria-hidden="true" />
      <a className="facade__hit" href={href} target="_blank" rel="noopener" data-live-open="facade" data-video={vid}>
        <span className="sr-only">{label}</span>
      </a>
      <span className="bug bug--air" aria-hidden="true"><i className="bug__dot" /><span>{live ? 'LIVE' : 'REPLAY'}</span></span>
      <span className="bug bug--clock" aria-hidden="true"><span data-clock="">{clock ? <Num text={clock} /> : 'ET'}</span></span>
      <span className="disc" aria-hidden="true"><Icon name="play" /></span>
      <div className={'l3' + (live ? ' is-live' : '')} aria-hidden="true">
        <div className="l3__plate blade" data-surf-content="">
          <span className="l3__kick">{kick}</span>
          <span className="l3__name" data-fit="" ref={nameRef}>{s.name}</span>
          <span className="l3__hosts">{hostsOf(s)}</span>
          <span className="l3__bar"><i style={{ ['--p' as string]: live ? Math.min(1, Math.max(0, n!.prog ?? 0)).toFixed(4) : 0 }} /></span>
        </div>
        <div className={'l3__side' + (n?.state === 'off' ? ' is-off' : '')} hidden={!n}>
          <span className="l3__lbl">{lbl}</span>
          <Flaps value={n && !live ? cd(n.left) : ''} animate={vis} hidden={live} />
          {live ? <span className="l3__ends"><Num text={endsIn(n!.left)} /></span> : null}
        </div>
      </div>
      <span className="osd" aria-hidden="true" data-osd="" />
      <span className="surf" aria-hidden="true"><i className="surf__scan" /><i className="surf__noise" /></span>
    </div>
  );
}
