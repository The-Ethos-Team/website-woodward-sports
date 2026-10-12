import 'server-only';
/* Stories, categories and writers from the WordPress REST API on woodwardsports.com, with the snapshot as fallback.
   Cloudflare in front of the site needs a full browser User-Agent and may still block Vercel's servers: every call
   falls back to data/content.json on any error or after 5 s. Stories always link out to woodwardsports.com.

   All lists (newest, per team, per writer) come from one light index of every post (title, excerpt, categories,
   author: ~150 KB for 226 posts), so team filters, writer pages, counts and pagination always agree. Images and
   reading times are fetched only for the stories on screen. */
import { cache } from 'react';
import { REVALIDATE } from '@/lib/site';
import { DATA, NEWS_MEDIA, type SnapshotArticle } from '@/lib/snapshot';
import { WRITER_WP_SLUG } from '@/lib/config';
import { classify } from '@/lib/teams';
import { curly, decodeEntities, slugify, stripTags } from '@/lib/format';
import type { Img, Story, TeamId, Writer } from '@/lib/types';
import { getJSON } from './fetcher';

const WP = 'https://woodwardsports.com/wp-json/wp/v2';
const OPTS = { revalidate: REVALIDATE.stories, browserUA: true, tags: ['wp'] };
/** the index pages (100 posts each) and full texts are bigger: give them longer */
const BIG = { ...OPTS, timeout: 15000 };
const MAX_INDEX_PAGES = 5; // 500 posts

type WPCat = { id: number; name: string; slug: string; count: number; link: string };
type WPUser = { id: number; name: string; slug: string };
type WPPost = {
  id: number; date_gmt: string; link: string; title: { rendered: string }; excerpt: { rendered: string };
  categories: number[]; author: number; featured_media: number;
};
type WPMedia = {
  id: number; source_url: string; alt_text: string;
  media_details?: { width?: number; height?: number; sizes?: Record<string, { source_url: string; width: number; height: number }> };
};

export type StoryPage = { items: Story[]; total: number; pages: number; page: number; live: boolean };

/** One story in the index: everything but the image (fetched per page) + the WordPress media id. */
type Entry = Omit<Story, 'image' | 'readingMinutes'> & { media: number };

/* ------------------------------------------------------------------ writers and bylines */
const HOUSE = 'Woodward Sports';
const WRITER_NAMES = DATA.writers.map(w => w.name);
/** Guest and beat writers post on the house account and sign the first line ("By Nicholas Kohloff …",
    "Nicholas Kohloff | Detroit Tigers Beat Reporter …"). Matched only against known writers. */
const BYLINES: [RegExp, string][] = [
  ...WRITER_NAMES.filter(n => n !== HOUSE).map(n => [n, n] as [string, string]),
  ['Nick Kohloff', 'Nicholas Kohloff'],
].map(([alias, name]) => [new RegExp(`^(?:by:?\\s+)?${alias.replace(/[’']/g, "['’]").replace(/\s+/g, '\\s+')}\\b`, 'i'), name]);

function byline(excerpt: string): string | null {
  const head = excerpt.slice(0, 160);
  return BYLINES.find(([re]) => re.test(head))?.[1] ?? null;
}

/* ------------------------------------------------------------------ snapshot */
const SNAP: SnapshotArticle[] = (() => {
  const seen = new Set<number>();
  return [...DATA.articles, ...DATA.more_articles]
    .filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true)))
    .sort((a, b) => b.date.localeCompare(a.date));
})();
const SNAP_BY_ID = new Map(SNAP.map(a => [a.id, a]));
const SNAP_INDEX: Entry[] = SNAP.map(a => {
  const c = classify(a.title_display, a.categories.map(slugify));
  return { id: a.id, title: a.title_display, excerpt: a.excerpt, date: a.date, author: a.author, categories: a.categories, teams: c.teams, generic: c.generic, url: a.url, media: 0 };
});

function localImage(id: number, alt: string): Img | null {
  const m = NEWS_MEDIA[id];
  if (!m) return null;
  const srcSet = m.file_small !== m.file ? `/${m.file_small} ${m.w_small}w, /${m.file} ${m.w}w` : `/${m.file} ${m.w}w`;
  return { src: '/' + m.file_small, srcSet, w: m.w, h: m.h, alt, local: true };
}

/* ------------------------------------------------------------------ live lookups */
export async function getCategories(): Promise<Map<string, WPCat> | null> {
  const r = await getJSON<WPCat[]>(`${WP}/categories?per_page=100&_fields=id,name,slug,count,link`, OPTS);
  if (!r || !Array.isArray(r.data)) return null;
  return new Map(r.data.map(c => [c.slug, c]));
}

async function getUsers(): Promise<WPUser[] | null> {
  const r = await getJSON<WPUser[]>(`${WP}/users?per_page=100&_fields=id,name,slug`, OPTS);
  return r && Array.isArray(r.data) ? r.data : null;
}

async function getMedia(ids: number[]): Promise<Map<number, WPMedia>> {
  const want = [...new Set(ids.filter(Boolean))].sort((a, b) => a - b);
  if (!want.length) return new Map();
  const r = await getJSON<WPMedia[]>(`${WP}/media?per_page=100&include=${want.join(',')}&_fields=id,source_url,alt_text,media_details`, OPTS);
  return new Map((r && Array.isArray(r.data) ? r.data : []).map(m => [m.id, m]));
}

/** Reading time (words / 230) for the stories on screen, from their full text. */
async function getReadingMinutes(ids: number[]): Promise<Map<number, number>> {
  const want = [...new Set(ids)].sort((a, b) => a - b);
  if (!want.length) return new Map();
  const r = await getJSON<{ id: number; content: { rendered: string } }[]>(
    `${WP}/posts?per_page=${want.length}&include=${want.join(',')}&_fields=id,content`, BIG,
  );
  const out = new Map<number, number>();
  for (const p of r && Array.isArray(r.data) ? r.data : []) {
    const words = stripTags(p.content?.rendered ?? '').split(' ').filter(Boolean).length;
    if (words) out.set(p.id, Math.max(1, Math.ceil(words / 230)));
  }
  return out;
}

/** WordPress image sizes, smallest first; the original only when it isn't huge. 150×150 thumbnails are crops: skipped. */
function wpImage(m: WPMedia | undefined, alt: string): Img | null {
  if (!m) return null;
  const d = m.media_details ?? {};
  const cand = ['medium', 'medium_large', 'large', '1536x1536'].map(k => d.sizes?.[k]).filter(Boolean) as { source_url: string; width: number; height: number }[];
  if (d.width && d.height && d.width <= 1600) cand.push({ source_url: m.source_url, width: d.width, height: d.height });
  const sizes = [...new Map(cand.map(c => [c.width, c])).values()].sort((a, b) => a.width - b.width);
  const w = d.width ?? sizes[sizes.length - 1]?.width ?? 1200, h = d.height ?? sizes[sizes.length - 1]?.height ?? 675;
  if (!sizes.length) return { src: m.source_url, w, h, alt, local: false };
  const src = (sizes.find(s => s.width >= 600) ?? sizes[sizes.length - 1]).source_url;
  return { src, srcSet: sizes.map(s => `${s.source_url} ${s.width}w`).join(', '), w, h, alt, local: false };
}

/* ------------------------------------------------------------------ the index */
async function liveIndex(): Promise<Entry[] | null> {
  const [cats, users] = await Promise.all([getCategories(), getUsers()]);
  if (!cats) return null;
  const fields = 'id,date_gmt,link,title,excerpt,categories,author,featured_media';
  const url = (page: number) => `${WP}/posts?per_page=100&page=${page}&_fields=${fields}`;
  const first = await getJSON<WPPost[]>(url(1), BIG);
  if (!first || !Array.isArray(first.data)) return null;
  const pages = Math.min(MAX_INDEX_PAGES, Number(first.headers.get('x-wp-totalpages')) || 1);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => getJSON<WPPost[]>(url(i + 2), BIG)));
  const posts = [first, ...rest].flatMap(r => (r && Array.isArray(r.data) ? r.data : []));

  const catById = new Map([...cats.values()].map(c => [c.id, c]));
  const userById = new Map((users ?? []).map(u => [u.id, u]));
  const seen = new Set<number>();
  return posts
    .filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .map(p => {
      const cs = p.categories.map(id => catById.get(id)).filter(Boolean) as WPCat[];
      const title = curly(decodeEntities(p.title.rendered));
      const excerpt = stripTags(p.excerpt.rendered);
      const wpName = userById.get(p.author)?.name ?? HOUSE;
      const c = classify(title, cs.map(x => x.slug));
      return {
        id: p.id, title, url: p.link,
        excerpt: excerpt.replace(/\s*(\[…\]|…|\.\.\.)$/, '…'),
        date: p.date_gmt.endsWith('Z') ? p.date_gmt : p.date_gmt + 'Z',
        author: (wpName === HOUSE && byline(excerpt)) || wpName,
        categories: cs.map(x => decodeEntities(x.name)),
        teams: c.teams, generic: c.generic, media: p.featured_media,
      } satisfies Entry;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Every story, newest first (one fetch per request, cached by Next for REVALIDATE.stories). */
const getIndex = cache(async (): Promise<{ entries: Entry[]; live: boolean }> => {
  const live = await liveIndex();
  return live?.length ? { entries: live, live: true } : { entries: SNAP_INDEX, live: false };
});

async function withImages(list: Entry[], live: boolean): Promise<Story[]> {
  const needMedia = list.filter(e => !NEWS_MEDIA[e.id] && e.media).map(e => e.media);
  const needMins = list.filter(e => !SNAP_BY_ID.get(e.id)?.reading_minutes).map(e => e.id);
  const [media, mins] = live ? await Promise.all([getMedia(needMedia), getReadingMinutes(needMins)]) : [new Map<number, WPMedia>(), new Map<number, number>()];
  return list.map(({ media: mid, ...e }) => ({
    ...e,
    readingMinutes: SNAP_BY_ID.get(e.id)?.reading_minutes ?? mins.get(e.id) ?? null,
    image: localImage(e.id, '') ?? wpImage(media.get(mid), ''),
  }));
}

async function pageOf(all: Entry[], perPage: number, page: number, live: boolean): Promise<StoryPage> {
  const pages = Math.max(1, Math.ceil(all.length / perPage));
  const items = page > pages ? [] : await withImages(all.slice((page - 1) * perPage, page * perPage), live);
  return { items, total: all.length, pages, page, live };
}

const inTeam = (e: Entry, team: TeamId) => e.teams.includes(team) && !e.generic;

/* ------------------------------------------------------------------ public loaders */
/** Newest stories, optionally one team's, paginated. A page past the last one returns no items. */
export async function getStories(o: { team?: TeamId; perPage?: number; page?: number } = {}): Promise<StoryPage> {
  const perPage = o.perPage ?? 16, page = Math.max(1, o.page ?? 1);
  const { entries, live } = await getIndex();
  return pageOf(o.team ? entries.filter(e => inTeam(e, o.team!)) : entries, perPage, page, live);
}

/** Newest stories about any of these teams (show pages: what the show has been talking about). */
export async function getStoriesAbout(teams: TeamId[], n: number): Promise<Story[]> {
  const { entries, live } = await getIndex();
  return withImages(entries.filter(e => teams.some(t => inTeam(e, t))).slice(0, n), live);
}

/** Writer pages: content.json writers (WP authors and in-article bylines). */
export function getWriters(): Writer[] {
  return DATA.writers.map(w => ({
    slug: slugify(w.name), name: w.name, role: w.role, postCount: w.post_count, authorUrl: w.author_url,
    wpSlug: WRITER_WP_SLUG[w.name] ?? null,
  }));
}
export const writerSlug = (name: string) => {
  const w = DATA.writers.find(x => x.name === name);
  return w ? slugify(w.name) : null;
};

export async function getWriterStories(w: Writer, o: { perPage?: number; page?: number } = {}): Promise<StoryPage> {
  const { entries, live } = await getIndex();
  return pageOf(entries.filter(e => e.author === w.name), o.perPage ?? 11, Math.max(1, o.page ?? 1), live);
}

/** Privacy policy page meta (title, last modified, URL), when the WP page is reachable. */
export async function getPrivacyPage(): Promise<{ title: string; modified: string; link: string } | null> {
  const r = await getJSON<{ title: { rendered: string }; modified_gmt: string; link: string }[]>(
    `${WP}/pages?slug=privacy-policy&_fields=title,modified_gmt,link`, { ...OPTS, revalidate: REVALIDATE.pages },
  );
  const p = r?.data?.[0];
  return p ? { title: decodeEntities(p.title.rendered), modified: p.modified_gmt + 'Z', link: p.link } : null;
}
