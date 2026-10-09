import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { LeagueChips, TeamTiles, tileHeads } from '@/components/sections/Teams';
import { getTeamStories } from '@/lib/data';
import { pageMeta } from '@/lib/meta';

export const metadata = pageMeta({
  title: 'Teams',
  description: 'Pick your team: Detroit Lions, Pistons, Tigers, Red Wings, Michigan and Michigan State. The latest stories, replays and merch for each.',
  path: '/teams',
});

export default async function TeamsPage() {
  const heads = tileHeads(await getTeamStories());
  return (
    <>
      <PageHero kicker="LIONS · PISTONS · TIGERS · RED WINGS · MICHIGAN · MSU" title="Teams" dot sub="Find your team fast: the latest stories, replays, the shows that cover them and the gear." />
      <section id="teams" className="sec sec--ink2" aria-labelledby="teams-h">
        <div className="wrap">
          <SectionHead ch="01" name="TEAMS" title="PICK YOUR TEAM" sub="Tap a team for its hub." id="teams-h" />
          <TeamTiles heads={heads} mode="link" />
          <LeagueChips />
        </div>
      </section>
    </>
  );
}
