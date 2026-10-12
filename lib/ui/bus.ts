'use client';
/* Tiny command bus between client islands (Live Room, show sheet, Find, home stories filter). */

export type LiveFrom = 'btn' | 'facade' | 'dock' | 'sheet' | 'show' | 'card' | 'find';
/** title/meta/show of a video the Live Room's own list doesn't have (team pages, clips, search results) */
export interface LiveInfo { title: string; meta?: string; show?: string | null }
export interface LiveOpts { from?: LiveFrom; video?: string | null; opener?: HTMLElement | null; info?: LiveInfo }

type Handlers = {
  openLive: (o?: LiveOpts) => void;
  openSheet: (i: number, opener?: HTMLElement | null) => void;
  openFind: (opener?: HTMLElement | null) => void;
  openMenu: (opener?: HTMLElement | null) => void;
  /** returns false when no stories filter is mounted (not on the home page) */
  setStoryFilter: (team: string, o?: { scroll?: boolean }) => boolean;
};

const noop = () => {};
export const bus: Handlers = {
  openLive: noop,
  openSheet: noop,
  openFind: noop,
  openMenu: noop,
  setStoryFilter: () => false,
};

export function register<K extends keyof Handlers>(k: K, fn: Handlers[K]) {
  bus[k] = fn;
  return () => {
    if (bus[k] === fn) bus[k] = (k === 'setStoryFilter' ? () => false : noop) as Handlers[K];
  };
}
