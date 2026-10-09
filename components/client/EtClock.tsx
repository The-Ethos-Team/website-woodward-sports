'use client';
import { useEffect, useState } from 'react';
import { useLive } from '@/lib/live/store';
import { clean } from '@/lib/live/compute';
import { Num } from '@/components/ui/bits';

const etFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Detroit', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
export const clockText = (t: number) => clean(etFmt.format(new Date(t))) + ' ET';

/** "10:04:05 AM ET" from the shared live clock (null until mounted). With typeIn, the hero's
    `wsn:hero` event types it in, one character every 30 ms. */
export function useClockText(typeIn = false) {
  const n = useLive();
  const [typed, setTyped] = useState<number | null>(null);
  useEffect(() => {
    if (!typeIn) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const on = () => {
      const len = clockText(Date.now()).length;
      setTyped(0);
      for (let i = 1; i <= len; i++) timers.push(setTimeout(() => setTyped(i === len ? null : i), i * 30));
    };
    addEventListener('wsn:hero', on);
    return () => { removeEventListener('wsn:hero', on); timers.forEach(clearTimeout); };
  }, [typeIn]);
  if (!n) return null;
  const t = clockText(n.now);
  return typed === null ? t : t.slice(0, typed);
}

export function EtClock() {
  const t = useClockText();
  return (
    <span className="hdr__clock" aria-hidden="true">
      <span data-clock="">{t ? <Num text={t} /> : 'ET'}</span>
    </span>
  );
}
