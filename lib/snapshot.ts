import 'server-only';
/* The bundled snapshot (data/*.json, compiled 2026-10-08). Every live loader falls back to this. */
import content from '@/data/content.json';
import media from '@/data/media.json';
import shop from '@/data/shop.json';
import type { Show, Team } from './types';

export const DATA = content;
export const MEDIA = media;
export const SHOP_SNAPSHOT = shop as {
  title: string;
  handle: string;
  url: string;
  price: string;
  image: string;
  image_alt: string;
  image_w: number;
  image_h: number;
}[];

export const SHOWS = content.shows as unknown as Show[];
export const TEAMS = content.teams as unknown as Team[];
export const YT = content.youtube_channel;
export const SOC = content.social;
export const APP = content.app;
export const BRAND = content.brand;

export type SnapshotArticle = (typeof content.articles)[number];
export type SnapshotVideo = (typeof content.videos)[number];

/** Show art by show id (media.json keys differ from the ids; content_id is the link). */
export const SHOW_MEDIA: Record<string, { file: string; file_small: string; w: number; h: number }> = Object.fromEntries(
  Object.values(media.shows).map(v => [v.content_id, v]),
);
export const NEWS_MEDIA: Record<number, { file: string; file_small: string; w: number; h: number; w_small: number; alt: string }> =
  Object.fromEntries(Object.values(media.news).map(v => [v.post_id, v]));

/** Video thumbnails that ship in /public/img/videos (480 + 960, and 1280 for the hero video). */
export const LOCAL_VIDEOS = new Set(content.videos.map(v => v.id));
export const LOCAL_VIDEO_1280 = new Set(['8VO1arwMX4w']);

/** Show art (square) — local files. */
export function showArt(id: string) {
  const m = SHOW_MEDIA[id];
  return { sm: '/' + m.file_small, lg: '/' + m.file };
}

export function showById(id: string) {
  return SHOWS.find(s => s.id === id);
}
