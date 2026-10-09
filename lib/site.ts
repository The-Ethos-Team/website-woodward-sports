/* Site-wide settings. Server and client safe (no secrets, no Node APIs). */

/** Absolute base URL for canonical links, Open Graph, sitemap.xml and robots.txt. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://website-woodward-sports.vercel.app').replace(/\/+$/, '');

/**
 * THE indexing switch. The client's live site (woodwardsports.com) still exists, so this build asks search
 * engines not to index it (robots meta `noindex, follow`). Flip to `true` when this site becomes woodwardsports.com.
 * robots.txt never blocks crawling, so this one constant is the only switch (see README → "Turning indexing on").
 */
export const INDEXING = false;

export const SITE_NAME = 'Woodward Sports Network';
export const SITE_TITLE = 'Woodward Sports Network — Unfiltered Detroit Sports';
export const OG_ALT = 'Woodward Sports Network: unfiltered Detroit sports, live every weekday 8AM–7PM ET';

/** Live data revalidation windows, in seconds. */
export const REVALIDATE = {
  stories: 600,
  videos: 600,
  podcasts: 3600,
  shop: 3600,
  pages: 86400,
} as const;

/** Every live request gives up after this many ms and falls back to the bundled snapshot in data/*.json. */
export const FETCH_TIMEOUT_MS = 5000;

/** Cloudflare in front of woodwardsports.com rejects non-browser user agents. */
export const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
