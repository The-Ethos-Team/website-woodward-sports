'use client';

import { useEffect } from 'react';

type DL = Record<string, unknown>[];

/** Push to GTM's dataLayer (no-op when GTM isn't configured). */
export function track(event: string, params: Record<string, unknown> = {}) {
  const w = window as unknown as { dataLayer?: DL };
  if (!w.dataLayer) return;
  w.dataLayer.push({ event, ...params });
}

/* Outbound destinations worth reporting as conversions / sponsor touchpoints. */
const RULES: [RegExp, string][] = [
  [/podcasts\.apple\.com/, 'listen_apple'],
  [/open\.spotify\.com/, 'listen_spotify'],
  [/spreaker\.com/, 'listen_rss'],
  [/apps\.apple\.com/, 'app_store'],
  [/shop\.woodwardsports\.com/, 'shop_click'],
  [/ig\.me|m\.me/, 'advertise_contact'],
  [/youtube\.com\/.*(join)/, 'youtube_member'],
  [/youtube\.com|youtu\.be/, 'youtube_click'],
  [/woodwardsports\.com\/(?!wp-)/, 'story_click'],
  [/facebook\.com|instagram\.com|x\.com|tiktok\.com/, 'social_click'],
];

/**
 * One delegated click listener that reports Watch / Listen / Shop / Advertise / story clicks to GTM's dataLayer.
 * Mounted only when NEXT_PUBLIC_GTM_ID is set.
 */
export function Analytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('a,button');
      if (!el) return;
      const label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\(opens in new tab\)/gi, '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (el.hasAttribute('data-live-open')) {
        track('watch_open', { placement: el.getAttribute('data-live-open') || 'button', video_id: el.getAttribute('data-video') || undefined, label });
        return;
      }
      const href = el instanceof HTMLAnchorElement ? el.href : '';
      if (!href || href.startsWith(location.origin)) return;
      const hit = RULES.find(([re]) => re.test(href));
      if (hit) track(hit[1], { link_url: href, label, page_path: location.pathname });
    };
    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);
  return null;
}
