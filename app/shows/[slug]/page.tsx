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
import { getEpisodes, getStories, getStoriesAbout, getVideoPool } from '@/lib/data';
import { replayFor } from '@/lib/data/site';
import { SHOW_PLAYLISTS, TEAM, playlistUrl } from '@/lib/config';
import { titleTeams } from '@/lib/teams';
import { duration, fdate, hosts, nw, slotShort } from '@/lib/format';
import { pageMeta } from '@/lib/meta';
import { SHOWS, YT, showArt, showById } from '@/lib/snapshot';
import type { TeamId } from '@/lib/types';

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

const list = (xs: string[]) => (xs.length < 3 ? xs.join(' and ') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

export default async function ShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = showById((await params).slug);
  if (!s) notFound();
  const i = SHOWS.indexOf(s);
  const art = showArt(s.id);
  const [pool, { episodes }] = await Promise.all([getVideoPool(), getEpisodes(s.id, 5)]);
  const own = pool.shows[s.id] ?? { episodes: [], clips: [] };
  const replay = replayFor(s, pool);

  /* what the show has been talking about: teams named in its latest episode and clip titles */
  const tally = new Map<TeamId, number>();
  for (const v of [...own.episodes, ...own.clips]) for (const t of titleTeams(v.title)) tally.set(t, (tally.get(t) ?? 0) + 1);
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const talked = top.filter(([, c]) => c >= Math.max(2, top[0]?.[1] * 0.25)).slice(0, 3).map(([t]) => t);
  const related = talked.length ? await getStoriesAbout(talked, 5) : [];
  const stories = related.length >= 2 ? related : (await getStories({ perPage: 5 })).items;

  const also = (s.also_on_air ?? []).flatMap(a => a.names);
  const ch = String(i + 1).padStart(2, '0');
  const lists = SHOW_PLAYLISTS[s.id];

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
          <SectionHead ch={ch} name="WATCH" title="FULL EPISODES" sub="Every show, start to finish, newest first. Tap one to watch it right here." id="eps-h" />
          {own.episodes.length ? <VideoGrid videos={own.episodes.slice(0, 8)} /> : <p className="empty">The latest episodes are on YouTube.</p>}
          <div className="sec__foot"><Ext href={lists ? playlistUrl(lists.episodes) : YT.videos_url} className="textlink textlink--light"><span>All {s.short_name} episodes on YouTube</span><Arrow /></Ext></div>
        </div>
      </section>

      {own.clips.length ? (
        <section className="sec sec--ink" aria-labelledby="clips-h">
          <div className="wrap">
            <SectionHead ch={ch} name="WATCH" title="CLIPS" sub={`The big moments from ${s.name}, cut down.`} id="clips-h" />
            <VideoGrid videos={own.clips.slice(0, 8)} />
            {lists ? <div className="sec__foot"><Ext href={playlistUrl(lists.clips)} className="textlink textlink--light"><span>All {s.short_name} clips on YouTube</span><Arrow /></Ext></div> : null}
          </div>
        </section>
      ) : null}

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
          <SectionHead
            ch={ch} name="STORIES" id="rel-h"
            title={related.length >= 2 ? 'ON THE TABLE' : 'THE LATEST'}
            sub={related.length >= 2 ? `The newest ${list(talked.map(t => TEAM[t].short))} stories, the ${talked.length === 1 ? 'team' : 'teams'} ${s.name} has been talking about most.` : undefined}
          />
          <StoryList stories={stories} />
          <div className="sec__foot"><Link className="textlink" href="/stories"><span>All stories</span><Arrow /></Link></div>
        </div>
      </section>
    </>
  );
}
