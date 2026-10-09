import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { DATA, SHOWS } from '@/lib/snapshot';
import { TEAM_IDS } from '@/lib/config';
import { getWriters } from '@/lib/data/wp';

/** Every route, including the dynamic ones. lastModified: today for the live-fed pages, the snapshot date otherwise. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const snap = new Date(DATA.meta.generated + 'T12:00:00Z');
  const u = (path: string, lastModified: Date, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], priority: number) =>
    ({ url: SITE_URL + path, lastModified, changeFrequency, priority });
  return [
    u('/', now, 'hourly', 1),
    u('/watch', now, 'hourly', 0.9),
    u('/listen', now, 'daily', 0.8),
    u('/shows', now, 'daily', 0.9),
    ...SHOWS.map(s => u(`/shows/${s.id}`, now, 'daily', 0.8)),
    u('/teams', now, 'daily', 0.9),
    ...TEAM_IDS.map(t => u(`/teams/${t}`, now, 'hourly', 0.8)),
    u('/stories', now, 'hourly', 0.9),
    ...TEAM_IDS.map(t => u(`/stories?team=${t}`, now, 'hourly', 0.5)),
    ...getWriters().map(w => u(`/stories/author/${w.slug}`, now, 'daily', 0.5)),
    u('/watch-parties', snap, 'weekly', 0.6),
    u('/shop', now, 'daily', 0.7),
    u('/app', snap, 'monthly', 0.5),
    u('/advertise', snap, 'monthly', 0.6),
    u('/privacy', snap, 'yearly', 0.2),
  ];
}
