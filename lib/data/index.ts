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

export { getStories } from './wp';
export { getVideos } from './youtube';
export { getProducts } from './shop';
export { getEpisodes, getAllEpisodes } from './podcasts';
