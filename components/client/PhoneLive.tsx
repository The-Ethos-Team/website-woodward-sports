'use client';
import { useRef } from 'react';
import { useLive, useSchedule } from '@/lib/live/store';
import { backAt, cd, clean } from '@/lib/live/compute';
import { Dot, Icon, Num } from '@/components/ui/bits';
import { Flaps } from './Flaps';
import { useInView } from './hooks';

const etShort = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Detroit', hour: 'numeric', minute: '2-digit', hour12: true });
const NWR = /(\d{1,2}(?::\d{2})?(?:\s?[AP]M)?–\d{1,2}(?::\d{2})?\s?[AP]M)/;

/** The WSN Live! phone mock in the App section, running the same live clock. */
export function PhoneLive() {
  const S = useSchedule();
  const n = useLive();
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref, '0px');
  const s = S.shows[n?.i ?? 0], live = n?.state === 'live';
  const kick = !n ? 'UP NEXT' : live ? <><Dot />LIVE NOW</> : n.state === 'next' ? (n.left <= 15 * 60000 ? 'STARTING SOON' : 'UP NEXT') : `OFF AIR · ${backAt(n, S.shows, false)}`;
  const lbl = !n ? 'STARTS IN' : live ? 'ENDS IN' : n.state === 'next' ? 'STARTS IN' : 'BACK IN';
  return (
    <div className="phone" aria-hidden="true" ref={ref}>
      <div className="phone__screen">
        <div className="phone__status">
          <span>{n ? <Num text={clean(etShort.format(new Date(n.now))).replace(/ (AM|PM)/, '')} /> : 'WSN'}</span>
          <span className="phone__isl" />
          <span>LTE</span>
        </div>
        <div className="phone__bar"><img src="/img/logo.svg" width={34} height={34} alt="" /><span className="phone__title">WSN LIVE!</span></div>
        <div className={'phone__video' + (live ? ' is-live' : '')}>
          <img src={s.replayThumb.sm} width={480} height={270} alt="" loading="lazy" decoding="async" />
          <span className="bug bug--air"><i className="bug__dot" /><span>{live ? 'LIVE' : 'REPLAY'}</span></span>
        </div>
        <div className="phone__l3 blade"><span className="phone__kick">{kick}</span><span className="phone__name" style={{ ['--nw' as string]: s.nw.toFixed(1) }}>{s.name}</span></div>
        <div className={'phone__count' + (live ? ' is-live' : '')}>
          <span className="phone__lbl">{lbl}</span>
          <Flaps value={n ? cd(n.left) : ''} animate={vis} />
        </div>
        <div className="phone__list">
          {S.shows.map(x => (
            <span key={x.id}>
              <img src={x.art} width={480} height={480} alt="" loading="lazy" decoding="async" />
              <b>{x.short}</b>
              <i>{x.slotShort.replace(/ ET$/, '').split(NWR).map((t, k) => (k % 2 ? <span className="nw" key={k}>{t}</span> : t))}</i>
            </span>
          ))}
        </div>
        <div className="phone__tabs">
          <span><Icon name="shows" /></span><span><Icon name="teams" /></span><span className="is-on"><Icon name="play" /></span><span><Icon name="listen" /></span><span><Icon name="shop" /></span>
        </div>
      </div>
    </div>
  );
}
