import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext } from '@/components/ui/bits';
import { StoryList } from '@/components/ui/StoryList';
import { ChipScroll } from '@/components/client/ChipScroll';
import { getStories } from '@/lib/data';
import { getWriters } from '@/lib/data/wp';
import { TEAM, TEAM_IDS } from '@/lib/config';
import { pageMeta } from '@/lib/meta';
import { TEAMS } from '@/lib/snapshot';
import type { TeamId } from '@/lib/types';

const PER = 12;
type SP = Promise<{ team?: string | string[]; page?: string | string[] }>;
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
const teamParam = (v?: string | string[]) => (TEAM_IDS.includes(one(v) as TeamId) ? (one(v) as TeamId) : undefined);

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const team = teamParam((await searchParams).team);
  const t = team ? TEAMS.find(x => x.id === team) : null;
  return pageMeta({
    title: t ? `${t.name} stories` : 'Stories',
    description: t
      ? `The latest ${t.name} stories from the Woodward Sports newsroom.`
      : 'Breaking coverage, inside scoops and raw reactions from the Woodward newsroom: Lions, Pistons, Tigers, Red Wings, Michigan and MSU.',
    path: team ? `/stories?team=${team}` : '/stories',
  });
}

export default async function StoriesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const team = teamParam(sp.team);
  const page = Math.max(1, parseInt(one(sp.page) ?? '1', 10) || 1);
  const res = await getStories({ team, perPage: PER, page });
  const writers = getWriters();
  const href = (t?: string, p?: number) => {
    const q = new URLSearchParams();
    if (t) q.set('team', t);
    if (p && p > 1) q.set('page', String(p));
    const s = q.toString();
    return '/stories' + (s ? '?' + s : '');
  };
  const t = team ? TEAMS.find(x => x.id === team) : null;
  return (
    <>
      <PageHero
        kicker="THE NEWSROOM · UPDATED 24/7"
        title={t ? `${TEAM[t.id].short} stories` : 'Stories'} dot
        sub="Breaking coverage, inside scoops and raw reactions. If it’s going down in the 313, it’s dropping here first. Every story opens on woodwardsports.com."
      />
      <section id="stories" className="sec sec--paper" aria-labelledby="stories-h">
        <div className="wrap">
          <SectionHead ch="01" name="STORIES" title="THE LATEST" id="stories-h" />
        </div>
        <div className="fbar">
          <div className="wrap fbar__in">
            <span className="fbar__count">{res.total} {res.total === 1 ? 'story' : 'stories'}</span>
            <nav className="fchips fchips--static" aria-label="Filter stories by team">
              <Link className={'fchip' + (!team ? ' is-on' : '')} href={href()} aria-current={!team ? 'page' : undefined} scroll={false}>All</Link>
              {TEAM_IDS.map(id => (
                <Link key={id} className={'fchip' + (team === id ? ' is-on' : '')} href={href(id)} aria-current={team === id ? 'page' : undefined} style={{ ['--team' as string]: TEAM[id].color }} scroll={false}>
                  <i className="fchip__dot" />{TEAM[id].short}
                </Link>
              ))}
            </nav>
            <ChipScroll active={team ?? 'all'} />
          </div>
        </div>
        <div className="wrap">
          {res.items.length ? <StoryList stories={res.items} id="stories-list" /> : (
            <p className="stories__empty">No fresh {t ? TEAM[t.id].short : ''} stories here. <Ext href={t?.category_url ?? 'https://woodwardsports.com/news/'}>See all coverage on woodwardsports.com<Arrow /></Ext></p>
          )}
          {res.pages > 1 ? (
            <nav className="pager" aria-label="Pages">
              {page > 1 ? <Link className="btn btn--ink" href={href(team, page - 1)}>Newer</Link> : <span className="btn btn--ink" aria-disabled="true">Newer</span>}
              <span className="pager__n">Page {page} of {res.pages}</span>
              {page < res.pages ? <Link className="btn btn--ink" href={href(team, page + 1)}>Older</Link> : <span className="btn btn--ink" aria-disabled="true">Older</span>}
            </nav>
          ) : null}
          <p className="lchips__lbl lbl" id="writers-lbl">Writers</p>
          <ul className="lchips" aria-labelledby="writers-lbl">
            {writers.map(w => <li key={w.slug}><Link className="lchip" href={`/stories/author/${w.slug}`}>{w.name}</Link></li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
