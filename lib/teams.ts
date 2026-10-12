/* Which teams a story or video is about. Pure and shared by the data loaders. */
import { TEAM_CATEGORIES, TEAM_IDS, TEAM_TITLE } from './config';
import type { TeamId } from './types';

const RX = Object.fromEntries(TEAM_IDS.map(t => [t, new RegExp(TEAM_TITLE[t], 'i')])) as Record<TeamId, RegExp>;

/** Teams named in a title (stories and video titles alike). */
export const titleTeams = (title: string): TeamId[] => TEAM_IDS.filter(t => RX[t].test(title));

export const mentions = (title: string, team: TeamId) => RX[team].test(title);

/**
 * A title that names teams decides (fixes stories filed under the wrong team or left uncategorised); otherwise the
 * WordPress categories decide. "generic" marks roundups filed under 3+ teams that name none of them
 * ("Top 5 Detroit athletes"): they stay in the full story list but not in team lists.
 */
export function classify(title: string, categorySlugs: string[]): { teams: TeamId[]; generic: boolean } {
  const named = titleTeams(title);
  if (named.length) return { teams: named, generic: false };
  const teams = TEAM_IDS.filter(t => TEAM_CATEGORIES[t].some(c => categorySlugs.includes(c)));
  return { teams, generic: teams.length >= 3 };
}
