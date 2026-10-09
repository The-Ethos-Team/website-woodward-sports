'use client';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLive, useSchedule } from '@/lib/live/store';
import { clean, hm, parts, zonedToUtc, type Chip } from '@/lib/live/compute';
import { bus } from '@/lib/ui/bus';
import { mq, MQ } from '@/lib/ui/motion';
import { Dot, Icon, Num } from '@/components/ui/bits';

const etShort = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Detroit', hour: 'numeric', minute: '2-digit', hour12: true });
const NWR = /(\d{1,2}(?::\d{2})?(?:\s?[AP]M)?–\d{1,2}(?::\d{2})?\s?[AP]M(?: ET)?)/;
const nwText = (t: string) => t.split(NWR).map((x, i) => (i % 2 ? <span className="nw" key={i}>{x}</span> : x));
const cap = (c: Chip) => c[0].toUpperCase() + c.slice(1);

/** The Day Rail: weekday 8A–7P track (≥900) + show rows/cards, live chips, playhead, NOW line, local times.
    mode="sheet" opens the show sheet (home); mode="link" links each show to its page (/shows). */
export function DayRail({ gaps, mode = 'sheet' }: { gaps: string[]; mode?: 'sheet' | 'link' }) {
  const S = useSchedule();
  const n = useLive();
  const rail = useRef<HTMLOListElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const [head, setHead] = useState<number | null>(null);
  const [nx, setNx] = useState<{ x: number; t: string } | null>(null);
  const [local, setLocal] = useState<string[] | null>(null);
  const lastHead = useRef(0);
  const chips: Chip[] = n ? n.chips : S.shows.map(() => 'later');

  /* local times when the visitor is not on Detroit time */
  useEffect(() => {
    const now = Date.now(), p = parts(now, S.tz);
    const det = (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(now / 1000) * 1000) / 60000;
    const loc = -new Date(now).getTimezoneOffset();
    if (Math.abs(det - loc) < 1) return;
    const lf = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(S.shows.map(s => { const [h, m] = hm(s.start); return clean(lf.format(new Date(zonedToUtc(p.y, p.m, p.d, h, m, S.tz)))) + ' your time'; }));
  }, [S]);

  const place = useCallback((force: boolean) => {
    if (!n || !rail.current) return;
    if (!force && n.now - lastHead.current < 30000) return;
    lastHead.current = n.now;
    const rows = Array.from(rail.current.querySelectorAll<HTMLElement>('.rail__row[data-row]'));
    const gapRows = Array.from(rail.current.querySelectorAll<HTMLElement>('.rail__row[data-gap]'));
    let row: HTMLElement | null = null, f = 0;
    if (n.state === 'live') { row = rows[n.i]; f = n.prog ?? 0; }
    else if (n.state === 'next') {
      if (n.prevEnd) { row = gapRows[n.i - 1]; f = (n.now - n.prevEnd) / (n.start - n.prevEnd); } else { row = rows[0]; f = 0; }
    }
    setHead(row && !mq(MQ.wide) ? row.offsetTop + Math.min(1, Math.max(0, f)) * row.offsetHeight : null);
    const p = n.p, hrs = p.h + p.mi / 60;
    if (S.days.includes(p.wd) && hrs >= 8 && hrs <= 19 && lane.current) {
      setNx({ x: ((hrs - 8) / 11) * lane.current.clientWidth, t: 'NOW ' + clean(etShort.format(new Date(n.now))).replace(/ (AM|PM)/, '') });
    } else setNx(null);
  }, [n, S]);

  const key = n ? n.state + n.i : '';
  useLayoutEffect(() => { place(true); }, [key, place]);
  useEffect(() => { place(false); }, [place]);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = () => { clearTimeout(t); t = setTimeout(() => place(true), 120); };
    addEventListener('resize', on, { passive: true });
    return () => { removeEventListener('resize', on); clearTimeout(t); };
  }, [place]);

  const hours = Array.from({ length: 12 }, (_, k) => (
    <span key={k} style={{ ['--x' as string]: (k / 11).toFixed(4) }}>{((8 + k) % 12) || 12}{8 + k < 12 ? 'A' : 'P'}</span>
  ));
  const frac = (t: string) => { const [h, m] = hm(t); return (h + m / 60 - 8) / 11; };
  const rows: React.ReactNode[] = [];
  S.shows.forEach((s, i) => {
    const c = chips[i];
    const h = s.hosts.length < 3 ? s.hosts.join(' & ') : s.hosts.slice(0, -1).join(', ') + ' & ' + s.hosts[s.hosts.length - 1];
    rows.push(
      <li key={s.id} className={'rail__row' + (c === 'live' ? ' is-live' : c === 'next' ? ' is-next' : c === 'done' ? ' is-done' : '')} data-row={i} style={{ ['--i' as string]: i }}>
        <div className="srow">
          <img className="srow__art" src={s.art} srcSet={`${s.art} 480w, ${s.artL} 900w`} sizes="(min-width: 1100px) 300px, (min-width: 768px) 112px, 80px" width={480} height={480} alt="" loading="lazy" decoding="async" />
          <div className="srow__body">
            <p className="srow__slot">{nwText(s.slotShort)}<span className="srow__local">{local?.[i] ?? ''}</span></p>
            <h3 className="srow__name">
              {mode === 'link' ? (
                <Link className="srow__btn" href={s.page}>{s.name}</Link>
              ) : (
                <button className="srow__btn" type="button" onClick={e => bus.openSheet(i, e.currentTarget)}>{s.name}</button>
              )}
            </h3>
            <p className="srow__tag">{s.tagline}</p>
            {h ? <p className="srow__hosts">{h}</p> : null}
          </div>
          <span className={'chip chip--' + c}>{c === 'live' ? <><Dot />Live</> : cap(c)}</span>
          <span className="srow__more" aria-hidden="true"><Icon name="chev-r" /></span>
        </div>
      </li>,
    );
    if (i < gaps.length) {
      const [a, b] = gaps[i].split('–');
      const lab = (t: string) => `${+t.split(':')[0] % 12 || 12}`;
      const ampm = +b.split(':')[0] < 12 ? 'AM' : 'PM';
      rows.push(
        <li key={'g' + i} className="rail__row rail__row--gap" data-gap={i}>
          <span>Between shows · <span className="nw">{lab(a)}–{lab(b)} {ampm}</span></span>
        </li>,
      );
    }
  });

  return (
    <>
      <div className="trk" aria-hidden="true" data-reveal="">
        <div className="trk__hours">{hours}</div>
        <div className="trk__lane" ref={lane}>
          {gaps.map(g => (
            <span key={g} className="trk__gap" style={{ ['--a' as string]: frac(g.slice(0, 5)).toFixed(4), ['--b' as string]: frac(g.slice(6, 11)).toFixed(4) }} aria-hidden="true">{'/////'}</span>
          ))}
          {S.shows.map((s, i) => (
            <div key={s.id} className={'trk__blk' + (chips[i] === 'live' ? ' is-live' : chips[i] === 'done' ? ' is-done' : '')} style={{ ['--a' as string]: frac(s.start).toFixed(4), ['--b' as string]: frac(s.end).toFixed(4) }}>
              <span className="trk__nm">{s.short}</span>
              <span className="trk__tm">{nwText(s.slotShort.replace(/ ET$/, ''))}</span>
            </div>
          ))}
          <span className="trk__now" hidden={!nx} style={nx ? { ['--nx' as string]: nx.x.toFixed(1) + 'px' } : undefined}>
            <span className="trk__flag">{nx ? <Num text={nx.t} /> : 'NOW'}</span>
          </span>
        </div>
      </div>
      <div className="rail-wrap">
        <ol className="rail" data-reveal="" ref={rail}>{rows}</ol>
        <span className="rail__head" aria-hidden="true" hidden={head === null} style={head !== null ? { ['--y' as string]: head + 'px' } : undefined} />
      </div>
      <p className="smallprint">Weekdays · schedule may change.{local ? ' All times ET (Detroit), with your local time underneath.' : ''}</p>
    </>
  );
}
