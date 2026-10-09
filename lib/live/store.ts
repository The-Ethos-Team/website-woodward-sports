'use client';
/* One shared 1 Hz live clock for every client component (pill, clocks, hero lower-third, Day Rail, phone mock,
   Live Room, sheet). Ticks on the second, stops when the tab is hidden, never runs on the server. */
import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Schedule } from '@/lib/types';
import { compute, type LiveState } from './compute';

let schedule: Schedule | null = null;
let state: LiveState | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();

export function setSchedule(s: Schedule) {
  schedule = s;
}

function tick() {
  if (!schedule) return;
  state = compute(Date.now(), schedule);
  subs.forEach(f => f());
}
function loop() {
  timer = setTimeout(() => { tick(); loop(); }, 1000 - (Date.now() % 1000));
}
function start() { clearTimeout(timer); tick(); loop(); }
function stop() { clearTimeout(timer); }
const onVis = () => (document.hidden ? stop() : start());

function subscribe(f: () => void) {
  subs.add(f);
  if (subs.size === 1) {
    document.addEventListener('visibilitychange', onVis);
    queueMicrotask(start);
  }
  return () => {
    subs.delete(f);
    if (!subs.size) { stop(); document.removeEventListener('visibilitychange', onVis); }
  };
}

/** Current live state; null during SSR and hydration (so server HTML and first client render match). */
export function useLive(): LiveState | null {
  return useSyncExternalStore(subscribe, () => state, () => null);
}

export const getLive = () => state;

export const ScheduleContext = createContext<Schedule | null>(null);
export function useSchedule(): Schedule {
  const s = useContext(ScheduleContext);
  if (!s) throw new Error('ScheduleContext missing');
  return s;
}
