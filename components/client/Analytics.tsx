'use client';
/*
 * Analytics events (tracking plan: TRACKING.md).
 * Every event goes to GA4 (gtag) and to GTM's dataLayer. No-op when neither is loaded.
 * Context comes from the DOM: [data-show], [data-team], [data-slot], [data-placement], else the route.
 */
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

type DL = Record<string, unknown>[];
type Params = Record<string, unknown>;

export function track(event: string, params: Params = {}) {
  const w = window as unknown as { dataLayer?: DL; gtag?: (...a: unknown[]) => void };
  const p: Params = { page_path: location.pathname };
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') p[k] = v;
  if (w.gtag) w.gtag('event', event, p);
  if (w.dataLayer) w.dataLayer.push({ event, ...p });
}

const routeMatch = (re: RegExp) => location.pathname.match(re)?.[1];

/** Where on the page an element sits: explicit [data-placement], else the nearest landmark/section. */
export function placementOf(el: Element | null): string {
  if (!el) return 'unknown';
  const d = el.closest<HTMLElement>('[data-placement]')?.dataset.placement;
  if (d) return d;
  if (el.closest('.dock')) return 'dock';
  if (el.closest('.tkbar, .tk')) return 'ticker';
  if (el.closest('.lr')) return 'live_room';
  if (el.closest('.find')) return 'find';
  if (el.closest('header')) return 'header';
  if (el.closest('footer')) return 'footer';
  return el.closest<HTMLElement>('section[id]')?.id || 'page';
}

function context(el: Element) {
  return {
    show_id: el.closest<HTMLElement>('[data-show]')?.dataset.show || routeMatch(/^\/shows\/([^/]+)/),
    team_id: el.closest<HTMLElement>('[data-team]')?.dataset.team || routeMatch(/^\/teams\/([^/]+)/),
    placement: placementOf(el),
  };
}

/* Outbound destinations → event name (first match wins). */
const OUTBOUND: [RegExp, string][] = [
  [/podcasts\.apple\.com/, 'listen_apple'],
  [/open\.spotify\.com/, 'listen_spotify'],
  [/spreaker\.com/, 'listen_rss'],
  [/apps\.apple\.com/, 'app_store'],
  [/shop\.woodwardsports\.com/, 'shop_click'],
  [/\/\/(ig\.me|m\.me)\//, 'advertise_contact'],
  [/youtube\.com\/.*join/, 'youtube_member'],
];
/* Social profiles (not individual videos). */
const SOCIAL: [RegExp, string][] = [
  [/instagram\.com/, 'instagram'],
  [/facebook\.com/, 'facebook'],
  [/^(www\.)?(x|twitter)\.com/, 'x'],
  [/tiktok\.com/, 'tiktok'],
  [/youtube\.com\/(@|channel\/|c\/)[^/]+\/?$/, 'youtube'],
];

function slotParams(el: HTMLElement) {
  const id = el.dataset.slot || 'unknown';
  const [placement, subject] = id.split(':');
  const p: Params = { slot_id: id, slot_placement: placement, ...context(el) };
  if (subject && placement.startsWith('show')) p.show_id = subject;
  if (subject && placement.startsWith('team')) p.team_id = subject;
  return p;
}

export function Analytics() {
  const path = usePathname();

  /* clicks: one delegated listener */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('a,button');
      if (!el) return;
      const label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\(opens in new tab\)/gi, '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const ctx = context(el);

      const slot = el.closest<HTMLElement>('[data-slot]');
      if (slot) { track('sponsor_slot_click', { ...slotParams(slot), label }); return; }

      if (el.hasAttribute('data-live-open')) {
        track('watch_open', { ...ctx, placement: el.getAttribute('data-live-open') || ctx.placement, video_id: el.getAttribute('data-video') || undefined, label });
        return;
      }

      const href = el instanceof HTMLAnchorElement ? el.href : '';
      if (!href) return;
      const url = new URL(href, location.href);

      if (url.origin === location.origin) {
        const show = url.pathname.match(/^\/shows\/([^/]+)/)?.[1];
        const team = url.pathname.match(/^\/teams\/([^/]+)/)?.[1];
        if (show) track('show_click', { ...ctx, show_id: show, label });
        else if (team) track('team_click', { ...ctx, team_id: team, label });
        return;
      }

      const social = SOCIAL.find(([re]) => re.test(url.hostname + url.pathname));
      if (social) { track('social_click', { ...ctx, platform: social[1], link_url: href, label }); return; }

      const hit = OUTBOUND.find(([re]) => re.test(href));
      if (hit) {
        const extra = hit[1] === 'advertise_contact' ? { method: url.hostname === 'ig.me' ? 'instagram_dm' : 'messenger' } : {};
        track(hit[1], { ...ctx, link_url: href, label, ...extra });
        return;
      }
      if (/(^|\.)youtube\.com$|youtu\.be$/.test(url.hostname)) {
        track('youtube_click', { ...ctx, video_id: el.getAttribute('data-video') || url.searchParams.get('v') || undefined, link_url: href, label });
        return;
      }
      if (/(^|\.)woodwardsports\.com$/.test(url.hostname)) track('story_click', { ...ctx, link_url: href, label });
    };
    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  /* page-type views (in addition to GA4's automatic page_view) */
  useEffect(() => {
    const show = path.match(/^\/shows\/([^/]+)/)?.[1];
    const team = path.match(/^\/teams\/([^/]+)/)?.[1];
    if (show) track('show_view', { show_id: show });
    if (team) track('team_view', { team_id: team });
  }, [path]);

  /* sponsor slot impressions: ≥50% visible for ≥1 s, once per slot per page view */
  useEffect(() => {
    const seen = new Set<string>();
    const timers = new Map<Element, number>();
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        const el = en.target as HTMLElement;
        const id = el.dataset.slot || '';
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          if (!timers.has(el) && !seen.has(id)) {
            timers.set(el, window.setTimeout(() => {
              timers.delete(el);
              if (seen.has(id) || !el.isConnected) return;
              seen.add(id);
              track('sponsor_slot_view', slotParams(el));
            }, 1000));
          }
        } else if (timers.has(el)) {
          clearTimeout(timers.get(el));
          timers.delete(el);
        }
      }
    }, { threshold: [0, 0.5] });
    const watched = new WeakSet<Element>();
    const scan = () => document.querySelectorAll('[data-slot]').forEach(el => { if (!watched.has(el)) { watched.add(el); io.observe(el); } });
    scan();
    let raf = 0;
    const mo = new MutationObserver(muts => {
      /* a slot that switches subject in place (e.g. the show sheet paging to the next show) counts as a new placement */
      for (const m of muts) if (m.type === 'attributes' && m.target instanceof HTMLElement && m.target.dataset.slot) { io.unobserve(m.target); io.observe(m.target); }
      cancelAnimationFrame(raf); raf = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-slot'] });
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); timers.forEach(t => clearTimeout(t)); };
  }, [path]);

  return null;
}
