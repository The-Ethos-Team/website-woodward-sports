import 'server-only';
/* Latest uploads from the official channel's RSS feed (15 newest), snapshot fallback. */
import { BROWSER_UA, REVALIDATE } from '@/lib/site';
import { DATA, LOCAL_VIDEOS, LOCAL_VIDEO_1280, YT } from '@/lib/snapshot';
import { SHOW_MARKERS } from '@/lib/config';
import { curly, decodeEntities } from '@/lib/format';
import type { Video, VideoThumb } from '@/lib/types';
import { getText, xmlAttr, xmlBlocks, xmlText } from './fetcher';

const RSS = `https://www.youtube.com/feeds/videos.xml?channel_id=${YT.id}`;

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
  id: v.id, title: v.title, published: v.published, show: v.show, isShort: v.is_short, url: v.url, thumb: thumbFor(v.id),
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

export async function getVideos(): Promise<{ videos: Video[]; live: boolean }> {
  const xml = await getText(RSS, { revalidate: REVALIDATE.videos, tags: ['youtube'] });
  const entries = xml ? xmlBlocks(xml, 'entry') : [];
  if (!entries.length) return { videos: SNAPSHOT, live: false };
  const raw = entries.map(e => {
    const id = xmlText(e, 'yt:videoId') ?? '';
    return { id, title: curly(decodeEntities(xmlText(e, 'title') ?? '')), published: xmlText(e, 'published') ?? '', url: xmlAttr(e, 'link', 'href') ?? `https://www.youtube.com/watch?v=${id}` };
  }).filter(v => v.id);
  const videos = await Promise.all(raw.map(async (v, i) => {
    const snap = SNAP_BY_ID.get(v.id);
    if (snap) return snap;
    const [short, maxres] = await Promise.all([
      /#shorts?\b/i.test(v.title) ? true : isShort(v.id),
      i === 0 ? hasMaxres(v.id) : false,
    ]);
    return { ...v, show: showForTitle(v.title), isShort: short, thumb: thumbFor(v.id, maxres) } satisfies Video;
  }));
  return { videos, live: true };
}
