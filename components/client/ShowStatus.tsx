'use client';
import { useEffect, useState } from 'react';
import { useLive, useSchedule } from '@/lib/live/store';
import { clean, endsIn, hm, parts, zonedToUtc } from '@/lib/live/compute';
import { Dot, Num } from '@/components/ui/bits';

/** Live status of one show (chip + "starts in" / "ends in"), and its slot in the visitor's own time zone. */
export function ShowStatus({ id }: { id: string }) {
  const S = useSchedule();
  const n = useLive();
  const i = S.shows.findIndex(s => s.id === id);
  const [local, setLocal] = useState('');
  useEffect(() => {
    const now = Date.now(), p = parts(now, S.tz), s = S.shows[i];
    const det = (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(now / 1000) * 1000) / 60000;
    if (Math.abs(det + new Date(now).getTimezoneOffset()) < 1 || !s) return;
    const lf = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
    const t = (k: string) => { const [h, m] = hm(k); return clean(lf.format(new Date(zonedToUtc(p.y, p.m, p.d, h, m, S.tz)))); };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(`${t(s.start)}–${t(s.end)} your time`);
  }, [S, i]);
  const c = n ? n.chips[i] : null;
  const isThis = n && n.i === i;
  let note: React.ReactNode = null;
  if (n && isThis && n.state === 'live') note = <>Ends in <Num text={endsIn(n.left)} /></>;
  else if (n && isThis) note = <>Starts in <Num text={endsIn(n.left)} /></>;
  return (
    <>
      {c ? <span className={'chip chip--' + c}>{c === 'live' ? <><Dot />Live now</> : c}</span> : null}
      {note ? <span>{note}</span> : null}
      {local ? <span>{local}</span> : null}
    </>
  );
}
