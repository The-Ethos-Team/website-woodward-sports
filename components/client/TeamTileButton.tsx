'use client';
import { useRouter } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { bus } from '@/lib/ui/bus';

/** Home team tile: filters the stories below (FLIP morph) and scrolls to them; falls back to the team hub. */
export function TeamTileButton({ team, style, children }: { team: string; style: CSSProperties; children: ReactNode }) {
  const router = useRouter();
  return (
    <button className="tile" type="button" data-team={team} style={style}
      onClick={() => { if (!bus.setStoryFilter(team, { scroll: true })) router.push(`/teams/${team}`); }}>
      {children}
    </button>
  );
}
