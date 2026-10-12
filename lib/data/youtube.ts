import 'server-only';
/* Videos from the official channel: the channel RSS feed (15 newest uploads) plus the show and team playlists
   (each its own 15-item RSS feed, newest first), with the snapshot as fallback. */
import { cache } from 'react';
import { BROWSER_UA, REVALIDATE } from '@/lib/site';
import { DATA, LOCAL_VIDEOS, LOCAL_VIDEO_1280, YT } from '@/lib/snapshot';
import { SHOW_MARKERS, SHOW_PLAYLISTS, TEAM_IDS, TEAM_PLAYLIST } from '@/lib/config';
import { aboutOtherTeam, mentions } from '@/lib/teams';
import { curly, decodeEntities } from '@/lib/format';
import type { TeamId, Video, VideoThumb } from '@/lib/types';
import { getText, xmlAttr, xmlBlocks, xmlText } from './fetcher';

const RSS = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT.id}`;
const PLAYLIST_RSS = (id: string) => `https://www.youtube.com/feeds/videos.xml?playlist_id=${id}`;

export function thumbFor(id: string, hasMaxres = false): VideoThumb {
  if (LOCAL_VIDEOS.has(id)) {
    const b = `/img/videos/${id}`;
    return { sm: `${b}-480.webp`, md: `${b}-960.webp`, lg: LOCAL_VIDEO_1280.has(id) ? `${b}-1280.webp` : undefined, local: true };
  }
  const b = `https://i.ytimg.com/vi/${id}`;
  return { sm: `${b}/hqdefault.jpg`, md: hasMaxres ? `${b}/maxresdefault.jpg` : `${b}/hqdefault.jpg`, lg: hasMaxres ? `${b}/maxresdefault.jpg` : undefined, local: false };
}

export function showForTitle(title: string): string | null {
  const t = title.toLowerCase();
  for (const [id, marks] of Object.entries(SHOW_MARKERS)) if (marks.some(m => t.includes(m))) return id;
  return null;
}

const SNAPSHOT: Video[] = DATA.videos.map(v => ({
  id: v.id, title: v.title, published: v.published, show: v.show, isShort: v.is_short, url: v.url, thumb: thumbFor(v.id), kind: 'upload',
}));
const SNAP_BY_ID = new Map(SNAPSHOT.map(v => [v.id, v]));

/** YouTube answers /shorts/<id> with 200 for a Short and a redirect to /watch for a regular video. */
async function isShort(id: string): Promise<boolean> {
  try {
    /* the consent cookie keeps EU-located servers from being bounced to consent.youtube.com */
    const r = await fetch(`https://www.youtube.com/shorts/${id}`, {
      method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(3000), next: { revalidate: 86400 },
      headers: { 'User-Agent': BROWSER_UA, Cookie: 'SOCS=CAI; CONSENT=YES+' },
    });
    return r.status === 200;
  } catch {
    return false;
  }
}

async function hasMaxres(id: string): Promise<boolean> {
  try {
    const r = await fetch(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, { method: 'HEAD', signal: AbortSignal.timeout(3000), next: { revalidate: 86400 } });
    return r.ok;
  } catch {
    return false;
  }
}

function parseFeed(xml: string | null) {
  return (xml ? xmlBlocks(xml, 'entry') : []).map(e => {
    const id = xmlText(e, 'yt:videoId') ?? '';
    return { id, title: curly(decodeEntities(xmlText(e, 'title') ?? '')), published: xmlText(e, 'published') ?? '', url: xmlAttr(e, 'link', 'href') ?? `https://www.youtube.com/watch?v=${id}` };
  }).filter(v => v.id);
}

/** The channel's 15 newest uploads (Shorts detected, first one with a 1280 px thumbnail for the hero). */
export const getVideos = cache(async (): Promise<{ videos: Video[]; live: boolean }> => {
  const raw = parseFeed(await getText(RSS, { revalidate: REVALIDATE.videos, tags: ['youtube'], timeout: 10000 }));
  if (!raw.length) return { videos: SNAPSHOT, live: false };
  const videos = await Promise.all(raw.map(async (v, i) => {
    const snap = SNAP_BY_ID.get(v.id);
    if (snap) return snap;
    const [short, maxres] = await Promise.all([
      /#shorts?\b/i.test(v.title) ? true : isShort(v.id),
      i === 0 ? hasMaxres(v.id) : false,
    ]);
    return { ...v, show: showForTitle(v.title), isShort: short, thumb: thumbFor(v.id, maxres), kind: 'upload' } satisfies Video;
  }));
  return { videos, live: true };
});

async function getPlaylist(id: string, kind: NonNullable<Video['kind']>, show: string | null): Promise<Video[]> {
  const raw = parseFeed(await getText(PLAYLIST_RSS(id), { revalidate: REVALIDATE.videos, tags: ['youtube'], timeout: 10000 }));
  return raw.map(v => ({
    ...v, show: show ?? showForTitle(v.title), isShort: /#shorts?\b/i.test(v.title), thumb: thumbFor(v.id), kind,
  }));
}

export interface VideoPool {
  /** every known video, newest first, de-duplicated (channel feed + show and team playlists) */
  all: Video[];
  /** a show's own full episodes and clips, newest first */
  shows: Record<string, { episodes: Video[]; clips: Video[] }>;
  /** each team playlist's videos, newest first */
  teamLists: Record<TeamId, Video[]>;
  live: boolean;
}

/** Channel feed + 8 show playlists + team playlists. Each feed is cached for REVALIDATE.videos. */
export const getVideoPool = cache(async (): Promise<VideoPool> => {
  const showIds = Object.keys(SHOW_PLAYLISTS);
  const teamListIds = [...new Set(TEAM_IDS.map(t => TEAM_PLAYLIST[t].id))];
  const [{ videos: feed, live }, showLists, teamLists] = await Promise.all([
    getVideos(),
    Promise.all(showIds.map(async s => ({
      s, episodes: await getPlaylist(SHOW_PLAYLISTS[s].episodes, 'episode', s), clips: await getPlaylist(SHOW_PLAYLISTS[s].clips, 'clip', s),
    }))),
    Promise.all(teamListIds.map(async id => ({ id, videos: await getPlaylist(id, 'stream', null) }))),
  ]);

  const byId = new Map<string, Video>();
  const add = (v: Video) => {
    const have = byId.get(v.id);
    if (!have) { byId.set(v.id, v); return; }
    /* the feed knows Shorts and the hero thumbnail; a show playlist knows the show and whether it's a full episode */
    byId.set(v.id, { ...have, show: have.show ?? v.show, kind: have.kind === 'upload' || have.kind === 'stream' ? v.kind : have.kind });
  };
  showLists.forEach(l => { l.episodes.forEach(add); l.clips.forEach(add); });
  feed.forEach(v => {
    const have = byId.get(v.id);
    byId.set(v.id, have ? { ...v, show: v.show ?? have.show, kind: have.kind } : v);
  });
  teamLists.forEach(l => l.videos.forEach(add));

  const all = [...byId.values()].sort((a, b) => b.published.localeCompare(a.published));
  const pick = (ids: Video[]) => ids.map(v => byId.get(v.id)!).filter(v => !v.isShort);
  const listById = new Map(teamLists.map(l => [l.id, l.videos]));
  return {
    all,
    shows: Object.fromEntries(showLists.map(l => [l.s, { episodes: pick(l.episodes), clips: pick(l.clips) }])),
    teamLists: Object.fromEntries(TEAM_IDS.map(t => [t, pick(listById.get(TEAM_PLAYLIST[t].id) ?? [])])) as Record<TeamId, Video[]>,
    live: live || showLists.some(l => l.episodes.length > 0),
  };
});

/**
 * A team's videos: recent uploads, episodes and clips whose title names the team, newest first. When the shows
 * haven't covered the team lately (offseason), the team's own playlist fills in, and the page says so.
 */
export async function getTeamVideos(team: TeamId, n = 8): Promise<{ videos: Video[]; fromShows: number; fromPlaylist: number }> {
  const pool = await getVideoPool();
  const matched = pool.all.filter(v => !v.isShort && mentions(v.title, team)).slice(0, n);
  /* the team playlist fills in, minus videos about another team (the college football playlist is mostly Michigan) */
  const fill = matched.length >= 4 ? [] : pool.teamLists[team].filter(v => !matched.some(m => m.id === v.id) && !aboutOtherTeam(v.title, team)).slice(0, n - matched.length);
  return { videos: [...matched, ...fill], fromShows: matched.length, fromPlaylist: fill.length };
}
