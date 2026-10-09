/* Live logic, America/Detroit, DST-safe. Pure functions (client + server). Ported from js/main.js. */
import type { LiveShow, Schedule } from '@/lib/types';

export type Chip = 'live' | 'next' | 'done' | 'later';
export interface Parts { wd: number; y: number; m: number; d: number; h: number; mi: number; s: number }
export interface LiveState {
  state: 'live' | 'next' | 'off';
  i: number;
  start: number;
  end?: number;
  prog?: number;
  left: number;
  prevEnd?: number | null;
  wd?: number;
  chips: Chip[];
  p: Parts;
  now: number;
}

export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmts = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string) {
  let f = fmts.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    fmts.set(tz, f);
  }
  return f;
}
export function parts(t: number, tz: string): Parts {
  const o: Record<string, string> = {};
  for (const p of fmt(tz).formatToParts(new Date(t))) o[p.type] = p.value;
  return { wd: WD.indexOf(o.weekday), y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second };
}
export function zonedToUtc(y: number, m: number, dd: number, h: number, mi: number, tz: string) {
  const want = Date.UTC(y, m - 1, dd, h, mi);
  let t = want;
  for (let i = 0; i < 2; i++) {
    const p = parts(t, tz);
    t += want - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  }
  return t;
}
export const hm = (s: string) => s.split(':').map(Number) as [number, number];
const mins = (s: string) => { const [h, m] = hm(s); return h * 60 + m; };

export function compute(now: number, S: Pick<Schedule, 'tz' | 'days' | 'shows'>): LiveState {
  const SHOWS = S.shows, tz = S.tz;
  const p = parts(now, tz), cur = p.h * 60 + p.mi + p.s / 60;
  const at = (k: string, y = p.y, m = p.m, dd = p.d) => { const [h, mi] = hm(k); return zonedToUtc(y, m, dd, h, mi, tz); };
  const chips: Chip[] = SHOWS.map(() => 'later');
  if (S.days.includes(p.wd)) {
    for (let i = 0; i < SHOWS.length; i++) {
      const s = SHOWS[i], a = mins(s.start), b = mins(s.end);
      if (cur >= b) { chips[i] = 'done'; continue; }
      if (cur >= a) {
        chips[i] = 'live';
        if (i + 1 < SHOWS.length) chips[i + 1] = 'next';
        const start = at(s.start), end = at(s.end);
        return { state: 'live', i, start, end, prog: (now - start) / (end - start), left: end - now, chips, p, now };
      }
      chips[i] = 'next';
      const start = at(s.start);
      return { state: 'next', i, start, left: start - now, prevEnd: i ? at(SHOWS[i - 1].end) : null, chips, p, now };
    }
  }
  for (let k = 1; k <= 7; k++) {
    const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + k)), w = dt.getUTCDay();
    if (S.days.includes(w)) {
      const start = at(SHOWS[0].start, dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
      return { state: 'off', i: 0, start, left: start - now, wd: w, chips: SHOWS.map((_, j) => (j ? 'later' : 'next')), p, now };
    }
  }
  return { state: 'off', i: 0, start: now, left: 0, wd: 1, chips: SHOWS.map(() => 'later'), p, now };
}

export const pad = (n: number) => String(n).padStart(2, '0');
/** countdown "1D 02:03:04" / "02:03:04" */
export function cd(ms: number) {
  let s = Math.max(0, Math.ceil(ms / 1000));
  const D = Math.floor(s / 86400);
  s %= 86400;
  return (D ? D + 'D ' : '') + pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
}
export const hostsOf = (s: { hosts: string[] }) => (s.hosts.length < 3 ? s.hosts.join(' & ') : s.hosts.slice(0, -1).join(', ') + ' & ' + s.hosts[s.hosts.length - 1]);
export const clean = (s: string) => s.replace(/[  ]/g, ' ');
/** "8 AM ET", "8:30 AM ET" — no-break spaces: a time never splits across lines */
export const firstHour = (s: LiveShow, et = true) => { const [h, m] = hm(s.start); return `${h % 12 || 12}${m ? ':' + pad(m) : ''}\u00A0${h < 12 ? 'AM' : 'PM'}${et ? '\u00A0ET' : ''}`; };
export const backAt = (n: LiveState, S: LiveShow[], et: boolean) => `BACK ${WD[n.wd ?? 1].toUpperCase()} ${firstHour(S[n.i], et)}`;
export const endsIn = (ms: number) => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)}H ${pad(m % 60)}M` : `${m}M`; };
export function stateLine(n: LiveState, S: LiveShow[]) {
  const s = S[n.i];
  if (n.state === 'live') return `Live now: ${s.name} with ${hostsOf(s)}, until ${s.slotShort.split('–')[1]}.`;
  if (n.state === 'next') return `Up next: ${s.name} at ${firstHour(s)}.`;
  return `Off air. Back ${WD[n.wd ?? 1]} ${firstHour(s)} with ${s.name}.`;
}
export const keyOf = (n: LiveState | null) => (n ? n.state + n.i : '');
