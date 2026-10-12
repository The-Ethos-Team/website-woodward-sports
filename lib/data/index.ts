import 'server-only';
/* Page-level loaders composed from the source loaders. Every one of them falls back to the snapshot. */
import { TEAM_IDS } from '@/lib/config';
import type { Episode, Story, TeamId } from '@/lib/types';
import { getStories } from './wp';
import { getAllEpisodes } from './podcasts';

export async function getTeamStories(perPage = 4): Promise<Record<TeamId, Story[]>> {
  const all = await Promise.all(TEAM_IDS.map(t => getStories({ team: t, perPage })));
  return Object.fromEntries(TEAM_IDS.map((t, i) => [t, all[i].items])) as Record<TeamId, Story[]>;
}

export async function getLatestEpisodes(): Promise<Record<string, Episode | undefined>> {
  const all = await getAllEpisodes(5);
  return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.episodes[0]]));
}

/**
 * How many stories fill the paper list without leaving a lone card: a feature, up to 4 rows, then cards in rows
 * of 3 on desktop (StoryList). 7 available → 5, 10 → 8.
 */
export function fitStories(available: number, max: number) {
  const n = Math.min(available, max);
  return n <= 5 ? n : 5 + Math.floor((n - 5) / 3) * 3;
}

export { getStories, getStoriesAbout, getWriterStories } from './wp';
export { getVideos, getVideoPool, getTeamVideos } from './youtube';
export { getProducts, getProductsByHandle } from './shop';
export { getEpisodes, getAllEpisodes } from './podcasts';
