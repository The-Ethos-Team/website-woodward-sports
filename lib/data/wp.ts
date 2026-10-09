import 'server-only';
/* Stories, categories and writers from the WordPress REST API on woodwardsports.com, with the snapshot as fallback.
   Cloudflare in front of the site needs a full browser User-Agent and may still block Vercel's servers: every call
   falls back to data/content.json on any error or after 5 s. Stories always link out to woodwardsports.com. */
import { REVALIDATE } from '@/lib/site';
import { DATA, NEWS_MEDIA, type SnapshotArticle } from '@/lib/snapshot';
import { TEAM_CATEGORIES, TEAM_IDS, WRITER_WP_SLUG } from '@/lib/config';
import { curly, decodeEntities, slugify, stripTags } from '@/lib/format';
import type { Img, Story, TeamId, Writer } from '@/lib/types';
import { getJSON } from './fetcher';

const WP = 'https://woodwardsports.com/wp-json/wp/v2';
const OPTS = { revalidate: REVALIDATE.stories, browserUA: true, tags: ['wp'] };

type WPCat = { id: number; name: string; slug: string; count: number; link: string };
type WPUser = { id: number; name: string; slug: string };
type WPPost = {
  id: number; date_gmt: string; link: string; title: { rendered: string }; excerpt: { rendered: string };
  content?: { rendered: string }; categories: number[]; author: number; featured_media: number;
};
type WPMedia = {
  id: number; source_url: string; alt_text: string;
  media_details?: { width?: number; height?: number; sizes?: Record<string, { source_url: string; width: number; height: number }> };
};

export type StoryPage = { items: Story[]; total: number; pages: number; live: boolean };

/* ------------------------------------------------------------------ snapshot */
const SNAP: SnapshotArticle[] = (() => {
  const seen = new Set<number>();
  return [...DATA.articles, ...DATA.more_articles]
    .filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true)))
    .sort((a, b) => b.date.localeCompare(a.date));
})();
const SNAP_BY_ID = new Map(SNAP.map(a => [a.id, a]));

function localImage(id: number, alt: string): Img | null {
  const m = NEWS_MEDIA[id];
  if (!m) return null;
  const srcSet = m.file_small !== m.file ? `/${m.file_small} ${m.w_small}w, /${m.file} ${m.w}w` : `/${m.file} ${m.w}w`;
  return { src: '/' + m.file_small, srcSet, w: m.w, h: m.h, alt, local: true };
}

function fromSnapshot(a: SnapshotArticle): Story {
  return {
    id: a.id, title: a.title_display, excerpt: a.excerpt, date: a.date, author: a.author,
    categories: a.categories, teams: a.teams as TeamId[], readingMinutes: a.reading_minutes, url: a.url,
    image: localImage(a.id, ''),
  };
}

function snapshotPage(filter: (a: SnapshotArticle) => boolean, perPage: number, page: number): StoryPage {
  const all = SNAP.filter(filter);
  return { items: all.slice((page - 1) * perPage, page * perPage).map(fromSnapshot), total: all.length, pages: Math.max(1, Math.ceil(all.length / perPage)), live: false };
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

/* in-article bylines ("By Nicholas Kohloff") on the house account, matched only against known writers */
const KNOWN_WRITERS = DATA.writers.map(w => w.name);
const ALIASES: Record<string, string> = { 'Nick Kohloff': 'Nicholas Kohloff', "Ryan O'Bleness": 'Ryan O’Bleness' };
function byline(text: string): string | null {
  const m = text.slice(0, 500).match(/\bBy:?\s+([A-Z][\w’'.-]+(?:\s[A-Z][\w’'.-]+){1,2})/);
  if (!m) return null;
  const n = ALIASES[m[1]] ?? m[1].replace(/'/g, '’');
  return KNOWN_WRITERS.includes(n) ? n : null;
}

function wpImage(m: WPMedia | undefined, alt: string): Img | null {
  if (!m) return null;
  const s = m.media_details?.sizes ?? {};
  const pick = ['medium_large', 'large', '1536x1536'].map(k => s[k]).filter(Boolean);
  const w = m.media_details?.width ?? pick[0]?.width ?? 1200, h = m.media_details?.height ?? pick[0]?.height ?? 675;
  if (!pick.length) return { src: m.source_url, w, h, alt, local: false };
  return { src: pick[0].source_url, srcSet: pick.map(p => `${p.source_url} ${p.width}w`).join(', '), w: pick[0].width, h: pick[0].height, alt, local: false };
}

async function normalise(posts: WPPost[], cats: Map<string, WPCat>): Promise<Story[]> {
  const byId = new Map([...cats.values()].map(c => [c.id, c]));
  const [media, users] = await Promise.all([getMedia(posts.filter(p => !NEWS_MEDIA[p.id]).map(p => p.featured_media)), getUsers()]);
  const uById = new Map((users ?? []).map(u => [u.id, u]));
  return posts.map(p => {
    const snap = SNAP_BY_ID.get(p.id);
    if (snap) return fromSnapshot(snap);
    const slugs = p.categories.map(id => byId.get(id)?.slug).filter(Boolean) as string[];
    const names = p.categories.map(id => byId.get(id)?.name).filter(Boolean).map(n => decodeEntities(n as string));
    const teams = TEAM_IDS.filter(t => TEAM_CATEGORIES[t].some(c => slugs.includes(c)));
    const text = p.content ? stripTags(p.content.rendered) : '';
    const wpName = uById.get(p.author)?.name ?? 'Woodward Sports';
    const author = (wpName === 'Woodward Sports' && byline(text)) || wpName;
    const title = curly(decodeEntities(p.title.rendered));
    return {
      id: p.id, title, excerpt: stripTags(p.excerpt.rendered).replace(/\s*(\[…\]|…|\.\.\.)$/, '…'),
      date: p.date_gmt.endsWith('Z') ? p.date_gmt : p.date_gmt + 'Z', author, categories: names, teams,
      readingMinutes: text ? Math.max(1, Math.ceil(text.split(' ').length / 230)) : null, url: p.link,
      image: localImage(p.id, '') ?? wpImage(media.get(p.featured_media), ''),
    } satisfies Story;
  });
}

async function livePosts(q: Record<string, string>): Promise<{ posts: WPPost[]; total: number; pages: number; cats: Map<string, WPCat> } | null> {
  const cats = await getCategories();
  if (!cats) return null;
  const params = new URLSearchParams({ _fields: 'id,date_gmt,link,title,excerpt,content,categories,author,featured_media', ...q });
  const r = await getJSON<WPPost[]>(`${WP}/posts?${params}`, OPTS);
  if (!r || !Array.isArray(r.data)) return null;
  return { posts: r.data, total: Number(r.headers.get('x-wp-total')) || r.data.length, pages: Number(r.headers.get('x-wp-totalpages')) || 1, cats };
}

/* ------------------------------------------------------------------ public loaders */
/** Newest stories (optionally one team, or a set of category slugs), paginated. */
export async function getStories(o: { team?: TeamId; categories?: string[]; perPage?: number; page?: number } = {}): Promise<StoryPage> {
  const perPage = o.perPage ?? 16, page = Math.max(1, o.page ?? 1);
  const slugs = o.team ? TEAM_CATEGORIES[o.team] : o.categories;
  const snapFilter = (a: SnapshotArticle) =>
    o.team ? (a.teams as string[]).includes(o.team) : slugs ? a.categories.some(n => slugs.includes(slugify(n))) : true;
  if (slugs && !slugs.length) return { items: [], total: 0, pages: 1, live: false };
  const cats = await getCategories();
  if (!cats) return snapshotPage(snapFilter, perPage, page);
  const q: Record<string, string> = { per_page: String(perPage), page: String(page) };
  if (slugs) {
    const ids = slugs.map(s => cats.get(s)?.id).filter(Boolean);
    if (!ids.length) return { items: [], total: 0, pages: 1, live: true };
    q.categories = ids.join(',');
  }
  const r = await livePosts(q);
  if (!r) return snapshotPage(snapFilter, perPage, page);
  return { items: await normalise(r.posts, r.cats), total: r.total, pages: r.pages, live: true };
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

export async function getWriterStories(w: Writer, perPage = 24): Promise<StoryPage> {
  const snap = () => snapshotPage(a => a.author === w.name, perPage, 1);
  const cats = await getCategories();
  if (!cats) return snap();
  let q: Record<string, string>;
  if (w.wpSlug) {
    const users = await getUsers();
    const u = users?.find(x => x.slug === w.wpSlug);
    if (!u) return snap();
    q = { author: String(u.id), per_page: String(perPage) };
  } else {
    q = { search: w.name.split(' ').slice(-1)[0].replace('’', "'"), per_page: '20' };
  }
  const r = await livePosts(q);
  if (!r) return snap();
  const items = (await normalise(r.posts, r.cats)).filter(s => s.author === w.name);
  return { items, total: w.wpSlug && w.name !== 'Woodward Sports' ? r.total : items.length, pages: 1, live: true };
}

/** Privacy policy page meta (title, last modified, URL), when the WP page is reachable. */
export async function getPrivacyPage(): Promise<{ title: string; modified: string; link: string } | null> {
  const r = await getJSON<{ title: { rendered: string }; modified_gmt: string; link: string }[]>(
    `${WP}/pages?slug=privacy-policy&_fields=title,modified_gmt,link`, { ...OPTS, revalidate: REVALIDATE.pages },
  );
  const p = r?.data?.[0];
  return p ? { title: decodeEntities(p.title.rendered), modified: p.modified_gmt + 'Z', link: p.link } : null;
}
