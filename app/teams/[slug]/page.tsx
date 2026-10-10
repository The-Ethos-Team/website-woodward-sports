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
import { getProducts, getStories, getVideos } from '@/lib/data';
import { BRAND_PRODUCTS, TEAM, TEAM_COLLECTION, TEAM_IDS, TEAM_KEYWORDS } from '@/lib/config';
import { slotShort } from '@/lib/format';
import { pageMeta } from '@/lib/meta';
import { DATA, SHOWS, TEAMS, YT, showArt } from '@/lib/snapshot';
import type { TeamId, Video } from '@/lib/types';

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

function mentions(v: Video, team: TeamId) {
  const t = v.title.toLowerCase();
  return TEAM_KEYWORDS[team].some(k => new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(t));
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = teamOf((await params).slug);
  if (!t) notFound();
  const { big, short, color } = TEAM[t.id];
  const [stories, { videos }, { products }] = await Promise.all([getStories({ team: t.id, perPage: 9 }), getVideos(), getProducts()]);
  const vids = videos.filter(v => mentions(v, t.id));
  const covering = SHOWS.map(s => ({ s, n: videos.filter(v => v.show === s.id && mentions(v, t.id)).length })).sort((a, b) => b.n - a.n);
  const teamGear = products.filter(p => p.teams.includes(t.id));
  const gear = teamGear.length ? teamGear : products.filter(p => BRAND_PRODUCTS.includes(p.handle));
  const league = t.league.startsWith('NCAA') ? 'NCAA' : t.league;
  const catUrl = t.category_url;

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
          {stories.items.length ? <StoryList stories={stories.items} /> : <p className="empty">No {short} stories right now.</p>}
          <div className="sec__foot">
            <Link className="btn btn--ink" href={`/stories?team=${t.id}`}>More {short} stories</Link>
            <Ext href={catUrl} className="textlink"><span>All {short} coverage on woodwardsports.com</span><Arrow /></Ext>
          </div>
        </div>
      </section>

      <section className="sec sec--ink" aria-labelledby="tv-h">
        <div className="wrap">
          <SectionHead ch="02" name="WATCH" title="REPLAYS" sub={vids.length ? `${short} talk, fresh off the stream. Tap one to watch it right here.` : `No ${short} segments in the latest uploads. The newest shows are below.`} id="tv-h" />
          <VideoGrid videos={(vids.length ? vids : videos.filter(v => !v.isShort)).slice(0, 8)} />
        </div>
      </section>

      <section className="sec sec--ink2" aria-labelledby="tc-h">
        <div className="wrap">
          <SectionHead ch="03" name="ON THE SHOWS" title="WHO COVERS IT" sub={`${short} talk runs across the lineup, live every weekday.`} id="tc-h" />
          <ul className="covers" data-reveal="">
            {covering.map(({ s }, k) => (
              <li key={s.id} style={{ ['--i' as string]: k }}>
                <Link className="cover" href={`/shows/${s.id}`}>
                  <img src={showArt(s.id).sm} width={480} height={480} alt="" loading="lazy" decoding="async" />
                  <span><b>{s.name}</b><small>{slotShort(s)}</small></span>
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
            <Ext href={TEAM_COLLECTION[t.id] ?? DATA.shop.url} className="btn btn--ink"><span>Shop {teamGear.length ? short : 'all'}</span><Arrow /></Ext>
            <span className="shop__note">Prices from the store · may change</span>
          </div>
        </div>
      </section>
    </>
  );
}
