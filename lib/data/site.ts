import 'server-only';
/* Derived payloads shared by the layout (schedule for the live clients, the Find index) and the pages. */
import { DATA, SHOWS, TEAMS, YT, showArt } from '@/lib/snapshot';
import { NAME_FIT, TEAM } from '@/lib/config';
import { fdate, hosts, slotShort, teamTag } from '@/lib/format';
import type { FindItem, LiveVideo, Schedule, Show, Story, Video } from '@/lib/types';

export function replayFor(show: Show, videos: Video[]): Video {
  const vids = videos.filter(v => v.show === show.id && !v.isShort);
  const named = vids.find(v => v.title.toLowerCase().includes(show.short_name.toLowerCase()) || v.title.toLowerCase().includes(show.name.toLowerCase()));
  return named ?? vids[0] ?? videos.find(v => !v.isShort) ?? videos[0];
}

export function videoMeta(v: Video) {
  const show = SHOWS.find(s => s.id === v.show);
  return (show ? show.name : 'Woodward Sports') + ' · ' + fdate(v.published, false);
}

export function videoTag(v: Video) {
  const show = SHOWS.find(s => s.id === v.show);
  return v.isShort ? 'SHORT' : show ? show.short_name.toUpperCase() : 'WSN';
}

const liveVideo = (v: Video): LiveVideo => ({ id: v.id, show: v.show, title: v.title, meta: videoMeta(v), thumb: v.thumb });

export function buildSchedule(videos: Video[]): Schedule {
  return {
    tz: DATA.schedule.timezone,
    days: DATA.schedule.days,
    liveEmbed: `https://www.youtube.com/embed/live_stream?channel=${YT.id}&autoplay=1&playsinline=1`,
    vodEmbed: 'https://www.youtube-nocookie.com/embed/{id}?playsinline=1&rel=0&autoplay=1',
    liveUrl: YT.live_url,
    latest: liveVideo(videos.find(v => !v.isShort) ?? videos[0]),
    videos: videos.map(liveVideo),
    shows: SHOWS.map(s => {
      const r = replayFor(s, videos);
      const art = showArt(s.id);
      return {
        id: s.id, name: s.name, short: s.short_name, start: s.start, end: s.end, slot: s.slot_display, slotShort: slotShort(s),
        tagline: s.tagline, hosts: s.hosts, desc: s.description, art: art.sm, artL: art.lg, apple: s.apple_podcasts,
        spotify: s.spotify, rss: s.rss, page: `/shows/${s.id}`, replay: r.id, replayTitle: r.title, replayThumb: r.thumb, pod: s.podcast_name, nw: NAME_FIT[s.id] ?? 5,
      };
    }),
  };
}

export function buildFindIndex(stories: Story[], videos: Video[]): FindItem[] {
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
  for (const v of videos) {
    const show = SHOWS.find(s => s.id === v.show);
    out.push({ type: 'video', title: v.title, keys: [show?.name ?? '', v.isShort ? 'short' : 'replay'].join(' '), target: v.id });
  }
  return out;
}
