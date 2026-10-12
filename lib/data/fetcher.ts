import 'server-only';
import { BROWSER_UA, FETCH_TIMEOUT_MS } from '@/lib/site';

type Opts = {
  revalidate: number; tags?: string[]; browserUA?: boolean; accept?: string;
  /** first N bytes only (HTTP Range) */ bytes?: number;
  /** per-attempt timeout; bigger lists (the story index, playlists) get longer than the default 5 s */ timeout?: number;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
/* worth a second try: rate limits, server hiccups, timeouts and dropped connections (builds fetch in bursts) */
const RETRY = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Fetch with Next's data cache (`revalidate`) and a hard timeout, retried once after a short pause. Returns null on
 * any error, non-2xx status or timeout, so every caller can fall back to its bundled snapshot. Never throws.
 */
async function get(url: string, o: Opts): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          ...(o.browserUA ? { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' } : {}),
          Accept: o.accept ?? '*/*',
          ...(o.bytes ? { Range: `bytes=0-${o.bytes - 1}` } : {}),
        },
        signal: AbortSignal.timeout(o.timeout ?? FETCH_TIMEOUT_MS),
        next: { revalidate: o.revalidate, tags: o.tags },
      });
      if (res.ok) return res;
      console.warn(`[data] ${res.status} ${url}`);
      if (!RETRY.has(res.status)) return null;
      if (res.status === 429 && !attempt) { await sleep(2000 + Math.round(Math.random() * 1500)); continue; }
    } catch (e) {
      console.warn(`[data] ${attempt ? 'fallback' : 'retry'} for ${url}: ${(e as Error).message}`);
    }
    if (!attempt) await sleep(700 + Math.round(Math.random() * 600));
  }
  return null;
}

export async function getJSON<T>(url: string, o: Opts): Promise<{ data: T; headers: Headers } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await get(url, { accept: 'application/json', ...o });
    if (!res) return null;
    try {
      return { data: (await res.json()) as T, headers: res.headers };
    } catch (e) {
      /* the body can time out after the headers arrived: try once more */
      console.warn(`[data] bad JSON from ${url}: ${(e as Error).message}`);
    }
  }
  return null;
}

export async function getText(url: string, o: Opts): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await get(url, o);
    if (!res) return null;
    try {
      return await res.text();
    } catch (e) {
      console.warn(`[data] body failed for ${url}: ${(e as Error).message}`);
    }
  }
  return null;
}

/* --------------------------------------------------------------- tiny XML helpers (RSS/Atom, no dependency) */
export function xmlBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, 'g');
  return xml.match(re) ?? [];
}
export function xmlText(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  if (!m) return null;
  return m[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim();
}
export function xmlAttr(block: string, tag: string, attr: string): string | null {
  const m = block.match(new RegExp(`<${tag}\\s[^>]*?${attr}="([^"]*)"`));
  return m ? m[1] : null;
}
