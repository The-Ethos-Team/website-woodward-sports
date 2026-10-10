import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext, Icon } from '@/components/ui/bits';
import { StoryList } from '@/components/ui/StoryList';
import { VideoGrid } from '@/components/ui/VideoGrid';
import { PartnerSlot } from '@/components/sections/WatchParty';
import { ShowStatus } from '@/components/client/ShowStatus';
import { getEpisodes, getStories, getVideos } from '@/lib/data';
import { replayFor } from '@/lib/data/site';
import { SHOW_CATEGORIES } from '@/lib/config';
import { duration, fdate, hosts, nw, slotShort } from '@/lib/format';
import { pageMeta } from '@/lib/meta';
import { DATA, SHOWS, YT, showArt, showById } from '@/lib/snapshot';

export const dynamicParams = false;
export function generateStaticParams() {
  return SHOWS.map(s => ({ slug: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = showById((await params).slug);
  if (!s) return {};
  return pageMeta({
    title: s.name,
    description: `${s.tagline} ${s.name} with ${hosts(s)}, live ${slotShort(s)} Monday to Friday on Woodward Sports Network. Watch live, catch the replays or listen to ${s.podcast_name}.`,
    path: `/shows/${s.id}`,
    image: showArt(s.id).lg,
  });
}

export default async function ShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = showById((await params).slug);
  if (!s) notFound();
  const i = SHOWS.indexOf(s);
  const art = showArt(s.id);
  const cats = SHOW_CATEGORIES[s.id] ?? [];
  const [{ videos }, { episodes }, related] = await Promise.all([
    getVideos(), getEpisodes(s.id, 5), cats.length ? getStories({ categories: cats, perPage: 5 }) : Promise.resolve(null),
  ]);
  const stories = related && related.items.length >= 2 ? related : await getStories({ perPage: 5 });
  const showVideos = videos.filter(v => v.show === s.id);
  const replay = replayFor(s, videos);
  const also = (s.also_on_air ?? []).flatMap(a => a.names);
  const ch = String(i + 1).padStart(2, '0');
  const ytSearch = (DATA.shows.find(x => x.id === s.id) as { youtube_search?: string } | undefined)?.youtube_search ?? YT.videos_url;

  return (
    <>
      <PageHero
        art={{ src: art.sm, srcSet: `${art.sm} 480w, ${art.lg} 900w`, alt: `${s.name} show art` }}
        kicker={<>CH {ch} · <span className="nw">{slotShort(s)}</span> · <span className="nw">MON–FRI</span></>}
        title={s.name}
        tag={s.tagline}
        meta={<><ShowStatus id={s.id} /><span>{hosts(s)}</span></>}
        ctas={<>
          <a className="btn btn--blade btn--xl" href={replay?.url ?? YT.live_url} target="_blank" rel="noopener" data-live-open="show" data-show={s.id} data-video={replay?.id}>
            <Icon name="play" /><span>Watch</span><span className="sr-only"> {s.name} (opens in new tab)</span>
          </a>
          <Ext href={s.apple_podcasts} className="btn btn--ghost"><Icon name="pod" /><span>Apple Podcasts</span></Ext>
          {s.spotify ? <Ext href={s.spotify} className="btn btn--ghost"><Icon name="spotify" /><span>Spotify</span></Ext> : null}
          <Ext href={s.rss} className="pod__rss"><Icon name="rss" /><span>RSS</span></Ext>
        </>}
      />

      <section className="sec sec--ink" aria-labelledby="air-h">
        <div className="wrap">
          <SectionHead ch={ch} name="ON THE AIR" title="THE SHOW" id="air-h" />
          <p className="lead">{s.description}</p>
          <dl className="facts">
            <div><dt>Live</dt><dd>{nw(slotShort(s))}<small>Monday – Friday · America/Detroit</small></dd></div>
            <div><dt>Hosts</dt><dd>{hosts(s)}{also.length ? <small>Also on air: {also.join(', ')}</small> : null}</dd></div>
            <div><dt>Podcast</dt><dd>{s.podcast_name}<small>Apple Podcasts{s.spotify ? ', Spotify' : ''} and RSS</small></dd></div>
            <div><dt>Watch</dt><dd>YouTube Live<small>@WoodwardSports and the WSN Live! app</small></dd></div>
          </dl>
          <div className="sec__foot"><PartnerSlot k={`${s.short_name} presented by`} cta="Put your brand on the show" slot={`show_page:${s.id}`} /></div>
        </div>
      </section>

      <section className="sec sec--ink2" aria-labelledby="eps-h">
        <div className="wrap">
          <SectionHead ch={ch} name="WATCH" title="LATEST EPISODES" sub="Fresh off the stream. Tap one to watch it right here." id="eps-h" />
          {showVideos.length ? <VideoGrid videos={showVideos.slice(0, 8)} /> : <p className="empty">No new uploads from this show in the latest feed.</p>}
          <div className="sec__foot"><Ext href={ytSearch} className="textlink textlink--light"><span>All {s.short_name} videos on YouTube</span><Arrow /></Ext></div>
        </div>
      </section>

      <section className="sec sec--grad" aria-labelledby="pod-h">
        <div className="wrap">
          <SectionHead ch={ch} name="LISTEN" title="THE PODCAST" sub={`${s.podcast_name}: every show, as a podcast.`} id="pod-h" />
          <ul className="eps" data-reveal="">
            {episodes.map((e, k) => (
              <li className="ep" key={e.url} style={{ ['--i' as string]: k }}>
                <p className="ep__meta">{fdate(e.published)}{e.durationSeconds ? ' · ' + duration(e.durationSeconds) : ''}</p>
                <h3 className="ep__t"><Ext href={e.url}>{nw(e.title)}</Ext></h3>
                {e.audioUrl ? <audio controls preload="none" src={e.audioUrl} aria-label={`Play: ${e.title}`} /> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec sec--paper" aria-labelledby="rel-h">
        <div className="wrap">
          <SectionHead ch={ch} name="STORIES" title={related && related.items.length >= 2 ? 'RELATED STORIES' : 'THE LATEST'} id="rel-h" />
          <StoryList stories={stories.items} />
          <div className="sec__foot"><Link className="textlink" href="/stories"><span>All stories</span><Arrow /></Link></div>
        </div>
      </section>
    </>
  );
}
