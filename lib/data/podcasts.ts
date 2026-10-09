import 'server-only';
/* Latest podcast episodes per show from the Spreaker RSS feeds (URLs in content.json), snapshot fallback. */
import { REVALIDATE } from '@/lib/site';
import { SHOWS } from '@/lib/snapshot';
import { curly, decodeEntities } from '@/lib/format';
import type { Episode, Show } from '@/lib/types';
import { getText, xmlAttr, xmlBlocks, xmlText } from './fetcher';

function snapshot(s: Show): Episode[] {
  return (s.latest_episodes ?? []).map(e => ({
    title: e.title, published: new Date(e.published).toISOString(), url: e.url,
    durationSeconds: e.duration_seconds ?? null, audioUrl: e.audio_url ?? null,
  }));
}

export async function getEpisodes(showId: string, n = 5): Promise<{ episodes: Episode[]; live: boolean }> {
  const s = SHOWS.find(x => x.id === showId);
  if (!s) return { episodes: [], live: false };
  /* The full feeds are 0.4–6 MB (Next caches at most 2 MB per fetch): ask for the head of the file only.
     Spreaker's CDN honours Range; only complete <item> blocks are parsed. */
  const xml = await getText(s.rss, { revalidate: REVALIDATE.podcasts, tags: ['podcasts'], bytes: 300_000 });
  const items = xml ? xmlBlocks(xml, 'item').slice(0, n) : [];
  if (!items.length) return { episodes: snapshot(s).slice(0, n), live: false };
  const episodes = items.map(it => {
    const pub = xmlText(it, 'pubDate');
    const dur = xmlText(it, 'itunes:duration');
    const secs = dur ? (dur.includes(':') ? dur.split(':').reduce((a, b) => a * 60 + Number(b), 0) : Number(dur)) : null;
    return {
      title: curly(decodeEntities(xmlText(it, 'title') ?? '')),
      published: pub ? new Date(pub).toISOString() : '',
      url: xmlText(it, 'link') ?? s.spreaker,
      durationSeconds: secs && isFinite(secs) ? secs : null,
      audioUrl: xmlAttr(it, 'enclosure', 'url'),
    } satisfies Episode;
  });
  return { episodes, live: true };
}

export async function getAllEpisodes(n = 5) {
  const all = await Promise.all(SHOWS.map(s => getEpisodes(s.id, n)));
  return Object.fromEntries(SHOWS.map((s, i) => [s.id, all[i]])) as Record<string, { episodes: Episode[]; live: boolean }>;
}
