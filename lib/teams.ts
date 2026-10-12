/* Which teams a story or video is about. Pure and shared by the data loaders. */
import { TEAM_CATEGORIES, TEAM_IDS, TEAM_TITLE } from './config';
import type { TeamId } from './types';

const RX = Object.fromEntries(TEAM_IDS.map(t => [t, new RegExp(TEAM_TITLE[t], 'i')])) as Record<TeamId, RegExp>;

/** Teams named in a title (stories and video titles alike). */
export const titleTeams = (title: string): TeamId[] => TEAM_IDS.filter(t => RX[t].test(title));

export const mentions = (title: string, team: TeamId) => RX[team].test(title);

/* In a sports title a bare "Michigan" (not "Michigan State") is the Wolverines. Too loose for story headlines
   ("Top 5 cities in Michigan"), but right for telling a playlist video is about another team. */
const BARE_MICHIGAN = /\bmichigan\b(?!\s+state)/i;

/**
 * True when a title is about a different team and not this one, e.g. a Michigan watch party in the college football
 * playlist that also fills the MSU page. Used to keep team-playlist fill on topic.
 */
export function aboutOtherTeam(title: string, team: TeamId): boolean {
  if (mentions(title, team)) return false;
  if (titleTeams(title).some(t => t !== team)) return true;
  return team !== 'michigan' && BARE_MICHIGAN.test(title);
}

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
