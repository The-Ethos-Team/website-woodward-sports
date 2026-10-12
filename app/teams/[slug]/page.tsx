import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext, Icon } from '@/components/ui/bits';
import { StoryList } from '@/components/ui/StoryList';
import { VideoGrid } from '@/components/ui/VideoGrid';
import { ProductGrid } from '@/components/sections/Shop';
import { PartnerSlot } from '@/components/sections/WatchParty';
import { fitStories, getProducts, getProductsByHandle, getStories, getTeamVideos, getVideoPool } from '@/lib/data';
import { BRAND_PRODUCTS, TEAM, TEAM_COLLECTION, TEAM_IDS, TEAM_EXTRA_PRODUCTS, TEAM_PLAYLIST, playlistUrl } from '@/lib/config';
import { mentions } from '@/lib/teams';
import { slotShort } from '@/lib/format';
import { pageMeta } from '@/lib/meta';
import { DATA, SHOWS, TEAMS, YT, showArt } from '@/lib/snapshot';

export const dynamicParams = false;
export function generateStaticParams() {
  return TEAM_IDS.map(slug => ({ slug }));
}

const teamOf = (slug: string) => TEAMS.find(t => t.id === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = teamOf((await params).slug);
  if (!t) return {};
  return pageMeta({
    title: t.name,
    description: `${t.name} coverage from Woodward Sports Network: the latest ${t.short} stories, replays from the shows and ${t.short} gear. Unfiltered Detroit sports.`,
    path: `/teams/${t.id}`,
  });
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = teamOf((await params).slug);
  if (!t) notFound();
  const { big, short, color } = TEAM[t.id];
  const extra = TEAM_EXTRA_PRODUCTS[t.id];
  const [stories, tv, pool, { products }, collection] = await Promise.all([
    getStories({ team: t.id, perPage: 8 }), getTeamVideos(t.id, 8), getVideoPool(), getProducts(),
    extra ? getProductsByHandle(extra, t.id) : Promise.resolve([]),
  ]);
  const shown = stories.items.slice(0, fitStories(stories.items.length, 8));

  /* who covers it: each show's recent episodes and clips that name the team */
  const covering = SHOWS.map(s => {
    const own = pool.shows[s.id];
    return { s, n: own ? [...own.episodes, ...own.clips].filter(v => mentions(v.title, t.id)).length : 0 };
  }).sort((a, b) => b.n - a.n);
  const anyCover = covering.some(c => c.n > 0);

  const curated = products.filter(p => p.teams.includes(t.id));
  const teamGear = curated.length ? curated : collection;
  const gear = teamGear.length ? teamGear : products.filter(p => BRAND_PRODUCTS.includes(p.handle));
  const league = t.league.startsWith('NCAA') ? 'NCAA' : t.league;
  const catUrl = t.category_url;
  const pl = TEAM_PLAYLIST[t.id];
  const tvSub = tv.fromShows && !tv.fromPlaylist
    ? `${short} videos from WSN, newest first. Tap one to watch it right here.`
    : tv.fromShows
      ? `${short} videos from WSN, newest first, then more from the ${pl.name} playlist.`
      : `No new ${short} videos lately. The latest from WSN’s ${pl.name} playlist:`;

  return (
    <>
      <PageHero
        team={color}
        kicker={<span className="phero__league"><i aria-hidden="true" />{league} · {big}</span>}
        title={t.name}
        sub={`Every ${short} story, take and replay from the Woodward newsroom and the shows.`}
        meta={<span>{stories.total} {stories.total === 1 ? 'story' : 'stories'} on woodwardsports.com</span>}
        ctas={<>
          <a className="btn btn--blade btn--xl" href={YT.live_url} target="_blank" rel="noopener" data-live-open=""><Icon name="play" /><span>Watch Live</span><span className="sr-only"> (opens in new tab)</span></a>
          <Ext href={catUrl} className="btn btn--ghost"><span>{short} coverage</span><Icon name="ext" /></Ext>
        </>}
      />

      <section className="sec sec--paper" aria-labelledby="ts-h">
        <div className="wrap">
          <SectionHead ch="01" name={big} title="THE LATEST" sub={`${t.name} stories from the Woodward newsroom.`} id="ts-h" />
          {shown.length ? <StoryList stories={shown} /> : <p className="empty">No {short} stories right now.</p>}
          <div className="sec__foot">
            <Link className="btn btn--ink" href={`/stories?team=${t.id}`}>{stories.total > shown.length ? `All ${stories.total} ${short} stories` : `More ${short} stories`}</Link>
            <Ext href={catUrl} className="textlink"><span>All {short} coverage on woodwardsports.com</span><Arrow /></Ext>
          </div>
        </div>
      </section>

      <section className="sec sec--ink" aria-labelledby="tv-h">
        <div className="wrap">
          <SectionHead ch="02" name="WATCH" title="REPLAYS" sub={tv.videos.length ? tvSub : `No ${short} videos right now. The full lineup is on YouTube.`} id="tv-h" />
          {tv.videos.length ? <VideoGrid videos={tv.videos} /> : null}
          <div className="sec__foot"><Ext href={tv.fromPlaylist ? playlistUrl(pl.id) : YT.videos_url} className="textlink textlink--light"><span>{tv.fromPlaylist ? `${pl.name} on YouTube` : 'All videos on YouTube'}</span><Arrow /></Ext></div>
        </div>
      </section>

      <section className="sec sec--ink2" aria-labelledby="tc-h">
        <div className="wrap">
          <SectionHead ch="03" name="ON THE SHOWS" title="WHO COVERS IT" id="tc-h"
            sub={anyCover ? `The shows ranked by ${short} segments in their latest episodes and clips.` : `${short} talk runs across the lineup, live every weekday.`} />
          <ul className="covers" data-reveal="">
            {covering.map(({ s, n }, k) => (
              <li key={s.id} style={{ ['--i' as string]: k }}>
                <Link className="cover" href={`/shows/${s.id}`}>
                  <img src={showArt(s.id).sm} width={480} height={480} alt="" loading="lazy" decoding="async" />
                  <span>
                    <b>{s.name}</b>
                    <small>{slotShort(s)}</small>
                    {anyCover ? <small className="cover__n">{n ? `${n} recent ${short} ${n === 1 ? 'segment' : 'segments'}` : `No recent ${short} segments`}</small> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="sec__foot"><PartnerSlot k={`${short} coverage presented by`} cta="Sponsor the team hub" slot={`team_hub:${t.id}`} /></div>
        </div>
      </section>

      <section className="sec sec--paper" aria-labelledby="tg-h">
        <div className="wrap">
          <SectionHead ch="04" name="SHOP" title={teamGear.length ? `${big} GEAR` : 'MERCH DROP'} sub={teamGear.length ? `Rep the ${short} the Woodward way.` : 'The official home of Woodward Sports gear. Rep the street sign.'} id="tg-h" />
          <ProductGrid products={gear} />
          <div className="sec__foot">
            <Ext href={(teamGear.length && TEAM_COLLECTION[t.id]) || DATA.shop.url} className="btn btn--ink"><span>Shop {teamGear.length ? short : 'all'}</span><Arrow /></Ext>
            <span className="shop__note">Prices from the store · may change</span>
          </div>
        </div>
      </section>
    </>
  );
}
