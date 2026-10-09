/* Formatting helpers shared by server components (pure, deterministic: Detroit time, en-US). */
import { Fragment, type ReactNode } from 'react';
import type { Show, Story, TeamId } from './types';
import { TEAM } from './config';

const DET = 'America/Detroit';
const dFmt = new Intl.DateTimeFormat('en-US', { timeZone: DET, month: 'short', day: 'numeric', year: 'numeric' });
const dFmtNoYear = new Intl.DateTimeFormat('en-US', { timeZone: DET, month: 'short', day: 'numeric' });

/** "Oct 5, 2026" in Detroit time (UTC ISO in). */
export function fdate(iso: string, year = true) {
  const d = new Date(/Z|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + 'Z');
  if (isNaN(+d)) return '';
  return (year ? dFmt : dFmtNoYear).format(d);
}

export function hosts(s: { hosts: string[] }) {
  const h = s.hosts;
  return h.length < 3 ? h.join(' & ') : h.slice(0, -1).join(', ') + ' & ' + h[h.length - 1];
}

const p = (t: string) => t.split(':').map(Number) as [number, number];
/** "8–10 AM ET" */
export function slotShort(s: { start: string; end: string }) {
  const [h1, m1] = p(s.start), [h2, m2] = p(s.end);
  const f = (h: number, m: number) => `${h % 12 || 12}` + (m ? `:${String(m).padStart(2, '0')}` : '');
  const a1 = h1 < 12 ? 'AM' : 'PM', a2 = h2 < 12 ? 'AM' : 'PM';
  return a1 === a2 ? `${f(h1, m1)}–${f(h2, m2)} ${a2} ET` : `${f(h1, m1)} ${a1}–${f(h2, m2)} ${a2} ET`;
}
/** "8–10 AM" */
export const slotRange = (s: { start: string; end: string }) => slotShort(s).replace(/ ET$/, '');

/* No-break ranges (typography spec 4d): seasons, scores, time ranges, MON–FRI, dates, "5 min read", team names */
const NW_RE = new RegExp(
  '(\\b\\d{4}-\\d{2}\\b' +
    '|\\b\\d{2,3}-\\d{2,3}\\b' +
    '|\\b\\d{1,2}(?::\\d{2})?(?:\\s?[AP]M)?–\\d{1,2}(?::\\d{2})?\\s?[AP]M(?: ET)?' +
    '|\\bMON–FRI\\b' +
    '|\\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \\d{1,2}(?:, \\d{4})?' +
    '|\\b\\d+ min read\\b' +
    '|\\bRed Wings\\b|\\bMichigan State\\b' +
    '|\\blower-thirds?\\b)',
  'g',
);

/** Text with ranges that must never split wrapped in <span class="nw">. */
export function nw(text: string): ReactNode {
  const parts = text.split(NW_RE);
  if (parts.length === 1) return text;
  return parts.map((t, i) => (i % 2 ? <span className="nw" key={i}>{t}</span> : <Fragment key={i}>{t}</Fragment>));
}

/** Story tag label + colour (team, shared Michigan · MSU, Pop Culture, or Detroit Sports). */
export function teamTag(a: Pick<Story, 'teams' | 'categories'>): [string, string] {
  const t = a.teams;
  if (t.length === 1) return [TEAM[t[0]].short, TEAM[t[0]].color];
  if (t.length === 2 && t.includes('michigan') && t.includes('michigan-state')) return ['Michigan · MSU', '#FFCB05'];
  if (t.length > 1) return ['Detroit Sports', '#057D5A'];
  if (a.categories.includes('Pop Culture')) return ['Pop Culture', '#34E0A1'];
  return ['Detroit Sports', '#057D5A'];
}

export const teamLabel = (id: TeamId) => TEAM[id].short;

/** Typographic apostrophes, like every other string on the page. */
export const curly = (s: string) => s.replace(/(\w)'/g, '$1’').replace(/'(\w)/g, '‘$1');

export function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, '’').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”').replace(/&ldquo;/g, '“').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—');
}

export function stripTags(html: string) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** "2:05:37" / "48 min" */
export function duration(sec: number | null) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h} hr ${m} min` : `${m} min`;
}

export function showSlotLine(s: Show) {
  return slotShort(s) + ' · MON–FRI';
}
