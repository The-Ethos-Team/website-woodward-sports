# Woodward Sports Network — website (Next.js)

A multi-page **Next.js 16 (App Router, TypeScript)** site for Woodward Sports Network, built from the
"ON AIR ON WOODWARD" one-page preview. It keeps the preview's design exactly (same markup classes, same CSS,
same fonts, same motion and live logic) and adds the pages in [SITEMAP.md](SITEMAP.md).

- Client's live site, which this does not replace yet: https://woodwardsports.com/
- Hosting: Vercel (`vercel.json` forces the Next.js framework preset).
- No UI library, no CSS framework, no third-party scripts. YouTube loads only after a visitor presses play, and
  the whole site holds at most one iframe.

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # production build (type-checks)
npm run start          # serve the build, e.g. npm run start -- -p 8988
npm run lint           # ESLint (flat config, eslint-config-next)
```

Node 20.9 or newer.

## Structure

```
app/
  layout.tsx            global shell: header (status pill, ET clock, Find), ticker, footer, mobile dock,
                        Find overlay, show sheet, Live Room (mounted here so the mini player survives navigation),
                        metadata (title template, OG/Twitter, icons, manifest, robots)
  globals.css           the preview's main.css (unchanged) + the inner-page additions at the end
  page.tsx              home: hero, lineup, teams, stories, replays, listen, watch parties, shop, app, advertise
  watch/ listen/ shows/ shows/[slug]/ teams/ teams/[slug]/ stories/ stories/author/[slug]/
  watch-parties/ shop/ app/ advertise/ privacy/
  not-found.tsx         branded "Off air." page
  sitemap.ts robots.ts  /sitemap.xml and /robots.txt
components/
  sections/             server components: one per home section (reused by the inner pages)
  ui/                   presentational pieces (icons, section heads, story/video cards, images, page hero)
  client/               client islands: Boot, Ident, Header, Pill, Dock, Live Room, show sheet, Find,
                        hero facade, Day Rail, stories filter, ticker, tapes, phone mock
lib/
  site.ts               base URL, the INDEXING switch, revalidate windows, fetch timeout
  config.ts             editorial config: team colours/categories/keywords, nav, advertise inventory, contact
  snapshot.ts           the bundled snapshot (data/*.json)
  data/                 typed loaders: wp.ts, youtube.ts, podcasts.ts, shop.ts (+ fetcher.ts, site.ts)
  live/                 live schedule logic (America/Detroit, DST-safe) and the shared 1 Hz clock store
  ui/                   motion helpers (surf, split-flap, fit), overlay stack, command bus
data/                   content.json, media.json, shop.json: the snapshot every loader falls back to
public/                 img/, fonts/, site.webmanifest
```

## Editing content

| What | Where |
|---|---|
| Shows: name, tagline, hosts, description, podcast links | `data/content.json` → `shows[]` |
| **Schedule** (start/end, America/Detroit) | `data/content.json` → `shows[].start` / `end`; weekdays in `schedule.days` (1 = Mon … 5 = Fri); the "between shows" gaps in `schedule.gaps_in_day` |
| Curated merch (8 products, by Shopify handle) | `data/shop.json` |
| Team colours, WP categories, YouTube keywords, team merch | `lib/config.ts` |
| Advertise inventory, contact links | `lib/config.ts` → `INVENTORY`, `CONTACT` |
| Watch-party board, recap | `lib/config.ts` → `PARTY_BOARD`, `data/content.json` → `watch_party` |
| Writers (author pages) | `data/content.json` → `writers[]`, WP user slugs in `lib/config.ts` → `WRITER_WP_SLUG` |

**Live logic.** Everything runs in America/Detroit time and handles DST. States: **LIVE** during a show;
**UP NEXT** before 8 AM and between shows ("STARTING SOON" within 15 minutes); **OFF AIR** after 7 PM and at
weekends, with a countdown to the next weekday's first show. If a slot changes (for example Heavyweights moving to
4:45 PM), change `start` in `content.json` and redeploy.

## Data sources and caching

Every loader fetches live with Next's data cache (`fetch(..., { next: { revalidate } })`) and a hard 5-second
timeout, and falls back to the bundled snapshot in `data/*.json` on **any** error, non-2xx status or timeout.
Pages are statically generated and refreshed in the background (ISR) on the same windows.

| Source | Loader | Revalidate | Notes |
|---|---|---|---|
| WordPress REST: posts, categories, media, users, privacy page (`woodwardsports.com/wp-json/wp/v2/…`) | `lib/data/wp.ts` | 10 min | Cloudflare needs a full browser User-Agent and may still block Vercel's servers, so the fallback is mandatory. Stories always link out to woodwardsports.com (new tab). |
| YouTube RSS (`feeds/videos.xml?channel_id=UC8sYt4QHV6ZgOyL57ATacwQ`) | `lib/data/youtube.ts` | 10 min | 15 newest uploads; Shorts detected via `/shorts/<id>`; show matched from the title |
| Spreaker RSS (URLs in `content.json` → `shows[].rss`) | `lib/data/podcasts.ts` | 1 h | Feeds are 0.4–6 MB, so only the first 300 KB is requested (HTTP Range) |
| Shopify (`shop.woodwardsports.com/products/<handle>.json`) | `lib/data/shop.ts` | 1 h | Only the curated 8 from `shop.json`, with live price and image |

**Images.** Local images in `public/img` are pre-sized webp with hand-written `srcset`. Live images from YouTube
and Shopify go through `next/image` (`images.remotePatterns` in `next.config.ts`). WordPress images load straight
from woodwardsports.com in its own sizes, because Cloudflare can block Vercel's image optimizer.

**No email is published.** `content.json` → `contact.email` is `null`; the Advertise button opens Instagram DM
(Messenger as the alternative). When the client provides an advertising address, change `CONTACT` in `lib/config.ts`.

## Turning indexing on

The site ships with `<meta name="robots" content="noindex, follow">` because the client's real site is still live.
The switch is one constant:

```ts
// lib/site.ts
export const INDEXING = false;   // → true when this becomes woodwardsports.com
```

`/robots.txt` never blocks crawling and always points to `/sitemap.xml`, so this constant is the only switch.

## Environment variables

| Variable | Default | Used for |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://website-woodward-sports.vercel.app` | canonical URLs, Open Graph/Twitter images, `sitemap.xml`, `robots.txt` |

No secrets are needed: every source is public.

## Gaps the client must confirm

1. **Advertising contact.** No advertising email is published; the CTA is an Instagram DM.
2. **Crunch Time on Spotify.** No Spotify listing was found, so that show has Apple Podcasts and RSS only.
3. **Android app.** The Google Play link 404s, so only the iOS app (WSN Live!) is shown.
4. Not stated anywhere and not invented: founding year, leadership, host bios/headshots, weekend programming,
   what airs between shows ("Between shows"), upcoming watch parties (the last one was 9/17/26).
