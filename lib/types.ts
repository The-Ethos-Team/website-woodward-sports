/* Normalised shapes shared by the data loaders, server components and client components. */

export type TeamId = 'lions' | 'pistons' | 'tigers' | 'red-wings' | 'michigan' | 'michigan-state';

export interface Img {
  src: string;
  srcSet?: string;
  w: number;
  h: number;
  alt: string;
  /** true = file in /public (pre-sized webp); false = remote (live source) */
  local: boolean;
}

export interface Story {
  id: number;
  title: string;
  excerpt: string;
  /** ISO, UTC */
  date: string;
  author: string;
  categories: string[];
  teams: TeamId[];
  readingMinutes: number | null;
  url: string;
  image: Img | null;
}

export interface VideoThumb {
  /** ~480 px wide */
  sm: string;
  /** ~960 px wide */
  md: string;
  /** 1280 px wide, hero only (when it exists) */
  lg?: string;
  local: boolean;
}

export interface Video {
  id: string;
  title: string;
  /** ISO */
  published: string;
  show: string | null;
  isShort: boolean;
  url: string;
  thumb: VideoThumb;
}

export interface Episode {
  title: string;
  /** ISO */
  published: string;
  url: string;
  durationSeconds: number | null;
  audioUrl: string | null;
}

export interface Product {
  handle: string;
  title: string;
  url: string;
  /** "39.99" */
  price: string;
  image: Img;
  teams: TeamId[];
}

export interface Show {
  id: string;
  name: string;
  short_name: string;
  slot_display: string;
  start: string;
  end: string;
  tagline: string;
  description: string;
  hosts: string[];
  host_descriptors?: Record<string, string>;
  also_on_air?: { names: string[]; source: string }[];
  page_url: string;
  apple_podcasts: string;
  spotify: string | null;
  spreaker: string;
  rss: string;
  podcast_name: string;
  podcast_description?: string;
  latest_episodes: { title: string; published: string; url: string; duration_seconds?: number; audio_url?: string }[];
}

export interface Team {
  id: TeamId;
  name: string;
  short: string;
  league: string;
  category_url: string;
  alt_category_urls: string[];
  post_count: number;
  latest_article_ids: number[];
}

export interface Writer {
  slug: string;
  name: string;
  role: string | null;
  postCount: number;
  authorUrl: string | null;
  /** WordPress user slug, when the writer has a WP account */
  wpSlug: string | null;
}

/** Live-schedule payload handed to client components (no secrets, small). */
export interface LiveShow {
  id: string;
  name: string;
  short: string;
  start: string;
  end: string;
  slot: string;
  slotShort: string;
  tagline: string;
  hosts: string[];
  desc: string;
  art: string;
  artL: string;
  apple: string;
  spotify: string | null;
  rss: string;
  page: string;
  replay: string;
  replayTitle: string;
  replayThumb: VideoThumb;
  pod: string;
  /** name width in em, for the phone mock's fit-to-width */
  nw: number;
}

export interface LiveVideo {
  id: string;
  show: string | null;
  title: string;
  meta: string;
  thumb: VideoThumb;
}

export interface Schedule {
  tz: string;
  days: number[];
  liveEmbed: string;
  vodEmbed: string;
  liveUrl: string;
  latest: LiveVideo;
  shows: LiveShow[];
  videos: LiveVideo[];
}

export interface FindItem {
  type: 'show' | 'team' | 'story' | 'video';
  title: string;
  keys: string;
  /** show/team: internal path · story: external URL · video: YouTube id */
  target: string;
}
