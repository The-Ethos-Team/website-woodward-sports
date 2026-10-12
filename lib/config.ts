/* Editorial config that is not in the WordPress/YouTube/Shopify feeds. Edit here. */
import type { TeamId } from './types';

/** Team accents: stripe, dot and glow only (design spec). [big label, short label, colour] */
export const TEAM: Record<TeamId, { big: string; short: string; color: string }> = {
  lions: { big: 'LIONS', short: 'Lions', color: '#0076B6' },
  pistons: { big: 'PISTONS', short: 'Pistons', color: '#C8102E' },
  tigers: { big: 'TIGERS', short: 'Tigers', color: '#FA4616' },
  'red-wings': { big: 'RED WINGS', short: 'Red Wings', color: '#CE1126' },
  michigan: { big: 'MICHIGAN', short: 'Michigan', color: '#FFCB05' },
  'michigan-state': { big: 'MSU', short: 'MSU', color: '#18453B' },
};
export const TEAM_IDS = Object.keys(TEAM) as TeamId[];

/** WordPress category slugs per team (the first is the main one). */
export const TEAM_CATEGORIES: Record<TeamId, string[]> = {
  lions: ['detroit-lions'],
  pistons: ['detroit-pistons'],
  tigers: ['detroit-tigers'],
  'red-wings': ['detroit-red-wings'],
  michigan: ['michigan', 'u-of-m'],
  'michigan-state': ['michigan-state', 'msu'],
};

/**
 * Title patterns that tie a story or a video to a team (case-insensitive). A title that names a team decides its
 * teams; otherwise the WordPress categories do (lib/teams.ts). Bare "Michigan" is left out on purpose: it is also
 * the state ("Top 5 cities in Michigan") and part of "Michigan State".
 */
export const TEAM_TITLE: Record<TeamId, string> = {
  lions: String.raw`\blions\b|dan campbell|\bgoff\b|nfc north|ford field|onepride|amon-ra|\bgibbs\b|penei sewell|hutchinson|brad holmes|jameson williams|kelvin sheppard|laporta|brian branch|kerby joseph|terrion arnold`,
  pistons: String.raw`\bpistons\b|cade cunningham|\bcade\b(?!\s+mays)|ausar|jalen duren|trajan langdon|bickerstaff|little caesars arena`,
  tigers: String.raw`\btigers\b|comerica park|skubal|\bhinch\b|riley greene|javier baez|javy baez|verlander|scott harris|kerry carpenter|jackson jobe|dingler`,
  'red-wings': String.raw`red wings|redwings|yzerman|\blarkin\b`,
  michigan: String.raw`michigan (?:football|basketball|wolverines)|wolverines|\bu of m\b|umich|go blue|sherrone moore|bryce underwood|big house`,
  'michigan-state': String.raw`michigan state|spartans|\bmsu\b|pat fitzgerald|\bizzo\b`,
};

/**
 * Official YouTube playlists (newest first; each has its own 15-item RSS feed). Show playlists give every show its
 * own latest episodes and clips; team playlists fill a team hub when the shows haven't covered the team lately.
 */
export const SHOW_PLAYLISTS: Record<string, { episodes: string; clips: string }> = {
  'big-d-energy': { episodes: 'PLkuv7SDBHkEXdK2mnAyMzAq1ppMK1sKO0', clips: 'PLkuv7SDBHkEVsoo66xHaLe8t4ftQfkB6V' },
  'crunch-time': { episodes: 'PLkuv7SDBHkEVsf1uU3OXk5pqsygDgYyjU', clips: 'PLkuv7SDBHkEXZLGSPSopfCAHTSY2aC9-L' },
  'braylon-edwards-show': { episodes: 'PLkuv7SDBHkEXhZKoHFjak5knkKKNtBiZi', clips: 'PLkuv7SDBHkEUJTB4TMFHIieF0TiDe7GLV' },
  'woodward-heavyweights': { episodes: 'PLkuv7SDBHkEV7x4uaQa25bZ5LpNsIeyna', clips: 'PLkuv7SDBHkEUXtUHByEAAkfXzT1flJdpB' },
};
export const TEAM_PLAYLIST: Record<TeamId, { id: string; name: string }> = {
  lions: { id: 'PLkuv7SDBHkEUehOeFDQptcH4VcnR2DQAP', name: 'Detroit Lions Streams' },
  pistons: { id: 'PLkuv7SDBHkEWwNGDhW6LOIcFAgjtdhOnE', name: 'Woodward Pistons Streams' },
  tigers: { id: 'PLkuv7SDBHkEV6HBXVoKff7o8k2Em-53aZ', name: 'Woodward Tigers Live' },
  'red-wings': { id: 'PLkuv7SDBHkEXB7NqmtuZcBA_5bKBOvZUm', name: 'Woodward Wings' },
  michigan: { id: 'PLkuv7SDBHkEVfc3WuK_jCfrNc1p005GMf', name: 'College Football Shows' },
  'michigan-state': { id: 'PLkuv7SDBHkEVfc3WuK_jCfrNc1p005GMf', name: 'College Football Shows' },
};
export const playlistUrl = (id: string) => `https://www.youtube.com/playlist?list=${id}`;

/** Title markers that tie a YouTube upload to a show. */
export const SHOW_MARKERS: Record<string, string[]> = {
  'big-d-energy': ['big d energy'],
  'crunch-time': ['crunch time'],
  'braylon-edwards-show': ['braylon edwards show'],
  'woodward-heavyweights': ['woodward heavyweights', 'heavyweights'],
};

/** Teams each curated product is for (merch on team hubs). */
export const PRODUCT_TEAMS: Record<string, TeamId[]> = {
  'woodward_lions_logo-1': ['lions'],
  'grit-lions-o-3': ['lions'],
  'woodward-pistons-pullover-hoodie': ['pistons'],
  'woodward-pistons-embroidered-pom-pom-knit-cap': ['pistons'],
  'woodward-tigers-pullover-hoodie': ['tigers'],
  'woodward-wings-pullover-hoodie': ['red-wings'],
};
/** WSN-brand merch, used where no team product exists and on show pages. */
export const BRAND_PRODUCTS = ['wsn-street-sign-logo', 'wsn-street-sign-mug'];

/** Shopify collections per team, for "more team gear". The store has no Michigan State collection. */
export const TEAM_COLLECTION: Partial<Record<TeamId, string>> = {
  lions: 'https://shop.woodwardsports.com/collections/detroit-football',
  pistons: 'https://shop.woodwardsports.com/collections/detroit-basketball',
  tigers: 'https://shop.woodwardsports.com/collections/detroit-baseball',
  'red-wings': 'https://shop.woodwardsports.com/collections/woodward-hockey',
  michigan: 'https://shop.woodwardsports.com/collections/michigan-gear',
};

/** Team gear outside the curated 8 (Shopify product handles, live price and image). Michigan: the HA1L line
    from the store's "University" collection. The store has no Michigan State gear. */
export const TEAM_EXTRA_PRODUCTS: Partial<Record<TeamId, string[]>> = {
  michigan: ['ha1l-pullover-hoodie', 'ha1l-heather-performance-tee', 'ha1l-men-s-long-sleeve-performance-tee', 'ha1l-flowy-racerback-tank'],
};

/** Writer pages: content.json writers, with their WordPress user slug where one exists. */
export const WRITER_WP_SLUG: Record<string, string> = {
  'Woodward Sports': 'jwarner',
  'Terry Foster': 'tfoster',
  'Brandon Dent': 'brandondent',
  'Eazy Ezerkis': 'eazy',
};

/** Lower-third fit-to-width: Anton advance width of each show name in em (typography spec §4i). */
export const NAME_FIT: Record<string, number> = { 'big-d-energy': 5.0, 'crunch-time': 5.1, 'braylon-edwards-show': 11.2, 'woodward-heavyweights': 10.3 };

/** Fit-to-width factor per blade title (typography spec 4i). */
export const BLADE_W: Record<string, number> = {
  'THE LINEUP': 5.3, 'PICK YOUR TEAM': 7.3, 'THE LATEST': 5.3, REPLAYS: 4.4, 'TURN IT UP.': 5.4,
  'WATCH PARTIES': 7.0, 'MERCH DROP': 6.0, 'TAKE US WITH YOU': 7.9, 'YOUR BRAND. ON AIR.': 9.0,
};

/** Primary navigation (header). */
export const NAV = [
  { label: 'Shows', href: '/shows', sec: 'lineup' },
  { label: 'Teams', href: '/teams', sec: 'teams' },
  { label: 'Stories', href: '/stories', sec: 'stories' },
  { label: 'Watch', href: '/watch', sec: 'watch' },
  { label: 'Listen', href: '/listen', sec: 'listen' },
  { label: 'Shop', href: '/shop', sec: 'shop' },
  { label: 'Advertise', href: '/advertise', sec: 'advertise' },
] as const;

/** Advertise inventory (no invented numbers or sponsors). */
export const INVENTORY: [string, string][] = [
  ['Presenting sponsor', 'Own the stream: your name on the network open, the bug and the lower-thirds of a whole show.'],
  ['Live reads', 'Hosts talk about your brand, live and in their own words, during the show.'],
  ['Bug & lower-third placements', 'Your logo on screen, next to the people Detroit fans tune in for.'],
  ['Ticker', 'Your name in the WSN headline crawl that runs across this site.'],
  ['Podcast ads', 'Pre-roll and mid-roll on all 4 show podcasts.'],
  ['Watch-party activations', 'Put your bar or brand at the center of the next fan watch party.'],
  ['Merch collabs', 'Co-branded drops in the Woodward Sports store.'],
  ['YouTube & social integrations', 'Branded segments, clips and posts across the WSN channels.'],
];

/** Advertise contact. No email is published until the client provides one (README → Advertise contact hook). */
export const CONTACT = {
  primary: 'https://ig.me/m/woodwardsports',
  alt: 'https://m.me/WoodwardSports',
};

/** Royal Oak watch-party board (Lions vs Bills, 9/17/26). */
export const PARTY_BOARD: [string, string, string][] = [
  ['HOPCAT', 'WATCH PARTY + POSTGAME', 'win'], ['BAR LOUIE', 'PREGAME SHOW', 'pre'],
  ['ROCK & BREWS', 'STREET TEAM', ''], ['O’TOOLES', 'STREET TEAM', ''], ['FIFTH AVE', 'STREET TEAM', ''], ['BLIND OWL', 'STREET TEAM', ''],
];
