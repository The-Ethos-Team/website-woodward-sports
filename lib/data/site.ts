import 'server-only';
/* Derived payloads shared by the layout (schedule for the live clients, the Find index) and the pages. */
import { DATA, SHOWS, TEAMS, YT, showArt } from '@/lib/snapshot';
import { NAME_FIT, TEAM } from '@/lib/config';
import { fdate, hosts, slotShort, teamTag } from '@/lib/format';
import type { FindItem, LiveVideo, Schedule, Show, Story, Video } from '@/lib/types';
import type { VideoPool } from './youtube';

/**
 * The video a show's Watch button plays: its newest full episode (from the show's own playlist), else its newest
 * clip. Only when the show has nothing at all does it fall back to the channel's newest upload.
 */
export function replayFor(show: Show, pool: VideoPool): Video {
  const own = pool.shows[show.id];
  return own?.episodes[0] ?? own?.clips[0] ?? pool.all.find(v => v.show === show.id && !v.isShort) ?? pool.all.find(v => !v.isShort) ?? pool.all[0];
}

/** "Crunch Time · Oct 12"; the year only when it isn't this year (offseason streams from last season). */
export function videoMeta(v: Video) {
  const show = SHOWS.find(s => s.id === v.show);
  const thisYear = new Date(v.published).getUTCFullYear() === new Date().getUTCFullYear();
  return (show ? show.name : 'Woodward Sports') + ' · ' + fdate(v.published, !thisYear);
}

export function videoTag(v: Video) {
  const show = SHOWS.find(s => s.id === v.show);
  if (v.isShort) return 'SHORT';
  if (show) return show.short_name.toUpperCase() + (v.kind === 'clip' ? ' · CLIP' : '');
  return v.kind === 'stream' ? 'LIVE STREAM' : 'WSN';
}

const liveVideo = (v: Video): LiveVideo => ({ id: v.id, show: v.show, title: v.title, meta: videoMeta(v), thumb: v.thumb });

/** feed = the channel's newest uploads (Live Room replay list); pool = feed + show playlists (each show's replay). */
export function buildSchedule(feed: Video[], pool: VideoPool): Schedule {
  const replays = SHOWS.map(s => replayFor(s, pool));
  const list = [...feed];
  for (const r of replays) if (!list.some(v => v.id === r.id)) list.push(r);
  return {
    tz: DATA.schedule.timezone,
    days: DATA.schedule.days,
    liveEmbed: `https://www.youtube.com/embed/live_stream?channel=${YT.id}&autoplay=1&playsinline=1`,
    vodEmbed: 'https://www.youtube-nocookie.com/embed/{id}?playsinline=1&rel=0&autoplay=1',
    liveUrl: YT.live_url,
    latest: liveVideo(feed.find(v => !v.isShort) ?? feed[0]),
    videos: list.map(liveVideo),
    shows: SHOWS.map((s, i) => {
      const r = replays[i];
      const art = showArt(s.id);
      return {
        id: s.id, name: s.name, short: s.short_name, start: s.start, end: s.end, slot: s.slot_display, slotShort: slotShort(s),
        tagline: s.tagline, hosts: s.hosts, desc: s.description, art: art.sm, artL: art.lg, apple: s.apple_podcasts,
        spotify: s.spotify, rss: s.rss, page: `/shows/${s.id}`, replay: r.id, replayTitle: r.title, replayThumb: r.thumb, pod: s.podcast_name, nw: NAME_FIT[s.id] ?? 5,
      };
    }),
  };
}

/** Find index: shows, teams, the newest stories, the newest uploads plus each show's latest episodes and clips. */
export function buildFindIndex(stories: Story[], feed: Video[], pool: VideoPool, perShow = 4): FindItem[] {
  const out: FindItem[] = [];
  for (const s of SHOWS) out.push({ type: 'show', title: s.name, keys: [s.short_name, hosts(s), s.tagline, s.slot_display, s.podcast_name].join(' '), target: `/shows/${s.id}` });
  for (const t of TEAMS) {
    const league = t.league.startsWith('NCAA') ? 'NCAA' : t.league;
    out.push({ type: 'team', title: t.name, keys: [t.name, t.short, league, TEAM[t.id].big].join(' '), target: `/teams/${t.id}` });
  }
  for (const a of stories) {
    const [tag] = teamTag(a);
    out.push({ type: 'story', title: a.title, keys: [a.author, tag, ...a.teams.map(t => TEAM[t].short)].join(' '), target: a.url });
  }
  const vids = [...feed];
  for (const s of SHOWS) {
    const own = pool.shows[s.id];
    for (const v of [...(own?.episodes.slice(0, perShow) ?? []), ...(own?.clips.slice(0, perShow) ?? [])]) if (!vids.some(x => x.id === v.id)) vids.push(v);
  }
  for (const v of vids) {
    const show = SHOWS.find(s => s.id === v.show);
    out.push({ type: 'video', title: v.title, keys: [show?.name ?? '', show ? hosts(show) : '', v.isShort ? 'short' : v.kind === 'clip' ? 'clip' : 'replay episode'].join(' '), target: v.id, meta: videoMeta(v), show: v.show });
  }
  return out;
}
