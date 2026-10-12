'use client';
import { useLive } from '@/lib/live/store';

/** Button text that follows the schedule: "Watch Live" while a show is on air, the off-air text otherwise. */
export function LiveLabel({ on, off }: { on: string; off: string }) {
  const n = useLive();
  return <span>{!n || n.state === 'live' ? on : off}</span>;
}
