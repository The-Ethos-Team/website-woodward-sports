import Link from 'next/link';
import { SectionHead } from '@/components/ui/SectionHead';
import { Ext, Icon } from '@/components/ui/bits';
import { TeamTileButton } from '@/components/client/TeamTileButton';
import { TEAM } from '@/lib/config';
import { DATA, TEAMS } from '@/lib/snapshot';
import { nw } from '@/lib/format';
import type { Story, TeamId } from '@/lib/types';

/** One headline per team, never the same story twice (Michigan and MSU share stories). */
export function tileHeads(teamStories: Record<TeamId, Story[]>) {
  const used = new Set<number>();
  return Object.fromEntries(TEAMS.map(t => {
    const list = teamStories[t.id] ?? [];
    const a = list.find(x => !used.has(x.id)) ?? list[0];
    if (a) used.add(a.id);
    return [t.id, a?.title ?? `${t.post_count} stories on woodwardsports.com`];
  })) as Record<TeamId, string>;
}

export function TeamTiles({ heads, mode }: { heads: Record<TeamId, string>; mode: 'filter' | 'link' }) {
  return (
    <ul className="tiles" data-reveal="">
      {TEAMS.map((t, i) => {
        const { big, color } = TEAM[t.id];
        const league = t.league.startsWith('NCAA') ? 'NCAA' : t.league;
        const inner = (
          <>
            <span className="tile__league">{league}</span>
            <span className="tile__name">{big}</span>
            <span className="tile__head">{nw(heads[t.id])}</span>
            <span className="tile__go" aria-hidden="true"><Icon name="chev-r" /></span>
          </>
        );
        const style = { ['--team' as string]: color };
        return (
          <li key={t.id} style={{ ['--i' as string]: i }}>
            {mode === 'link' ? (
              <Link className="tile" href={`/teams/${t.id}`} data-team={t.id} style={style}>{inner}</Link>
            ) : (
              <TeamTileButton team={t.id} style={style}>{inner}</TeamTileButton>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function LeagueChips() {
  const cats = Object.fromEntries(DATA.categories.map(c => [c.slug, c.url]));
  const leagues: [string, string][] = [['NFL', 'nfl'], ['NBA', 'nba'], ['MLB', 'mlb'], ['NHL', 'nhl'], ['NCAA', 'ncaa'], ['Pop Culture', 'pop-culture']];
  return (
    <>
      <p className="lchips__lbl lbl" id="lchips-lbl">More on woodwardsports.com</p>
      <ul className="lchips" aria-labelledby="lchips-lbl">
        {leagues.map(([l, s]) => (
          <li key={s}><Ext href={cats[s]} className="lchip">{l}<Icon name="ext" /></Ext></li>
        ))}
      </ul>
    </>
  );
}

export function Teams({ heads }: { heads: Record<TeamId, string> }) {
  return (
    <section id="teams" className="sec sec--ink2" aria-labelledby="teams-h">
      <div className="wrap">
        <SectionHead ch="03" name="TEAMS" title="PICK YOUR TEAM" sub="Lions, Pistons, Tigers, Red Wings, Michigan and MSU. Tap a team to filter the latest stories." id="teams-h" />
        <TeamTiles heads={heads} mode="filter" />
        <LeagueChips />
      </div>
    </section>
  );
}
