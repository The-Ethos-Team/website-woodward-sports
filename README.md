# Woodward Sports Network: new site preview

This is a one-page preview of a new **woodwardsports.com**, built as "ON AIR ON WOODWARD". The page plays like WSN's live channel. It has a station bug, an ET clock, a headline ticker, lower-thirds, a Day Rail lineup that knows what is on air right now, channel surfing between shows and a YouTube **Live Room**. Every broadcast graphic is cut from the Woodward street-sign stock used in the logo.

- Live preview: https://website-woodward-sports.vercel.app/ (Vercel, auto-deploys from main)
- Also on GitHub Pages: https://the-ethos-team.github.io/website-woodward-sports/
- Client's live site, which this does not replace yet: https://woodwardsports.com/
- Static HTML, CSS and vanilla JS. There is no framework, no build step to deploy and no third-party scripts. YouTube is loaded only after a visitor presses play, and the page holds at most one iframe.

## Structure

```
index.html            all content is server-rendered (reads fine without JS); schedule JSON is inline
css/main.css          design tokens, components, motion (transform/opacity only)
js/main.js            live logic, ident, reveals, split-flap, channel surf, Live Room, Find, Show sheet, team filter
fonts/*.woff2         self-hosted, latin only (84 KB): Anton 400 (display), Schibsted Grotesk
                      (variable 400–900, text/UI), Newsreader Italic 500 (show taglines only)
img/                  logo.svg (dark) + logo-on-light.svg, favicons, og-image.jpg (1200×630),
                      show-*.webp, news/<post-id>.webp, videos/<youtube-id>-480|960.webp,
                      shop/, party/, atmo-*.webp, badges/app-store.svg (Apple's official badge), noise.webp
data/                 content.json (facts), media.json (local image map), shop.json (merch)
tools/build.py        regenerates index.html from data/*.json (Python 3.9+, standard library only)
404.html              small branded "Off air" page
site.webmanifest, robots.txt, .nojekyll
```

## Editing content

**Recommended path:** edit the JSON in `data/` and run:

```
python3 tools/build.py
```

This rewrites `index.html` and stamps a new `?v=` cache-buster on the CSS and JS links, so Safari does not keep stale files. You can edit `index.html` by hand for one-off fixes. The next build overwrites those edits.

| What | Where |
|---|---|
| Shows: name, tagline, hosts, description, podcast links (Apple, Spotify, RSS) | `data/content.json` → `shows[]` |
| Schedule (start and end times, America/Detroit) | `data/content.json` → `shows[].start` / `end`, and `schedule.days` (1 = Mon … 5 = Fri) |
| Stories (the 16 newest) | `data/content.json` → `articles[]`, with images in `data/media.json` → `news` |
| Replays rail (15 videos) | `data/content.json` → `videos[]`, with thumbnails in `img/videos/<id>-480.webp` and `-960.webp` |
| Merch (8 products) | `data/shop.json` |
| Watch-party recap and board | `data/content.json` → `watch_party`; the board rows are in `tools/build.py` → `watch_party()` |
| Advertise inventory cards | `tools/build.py` → `advertise()` |

**The schedule and live logic.** `js/main.js` reads the inline `<script type="application/json" id="schedule">`. That script is generated from `shows[].start` and `shows[].end`. All times are America/Detroit, and DST is handled. The states are as follows:

- **LIVE** during a show.
- **UP NEXT** before 8 AM or in the gaps between shows. It reads "STARTING SOON" within 15 minutes of the start.
- **OFF AIR** after 7 PM and at weekends, with a countdown to the next Monday 8 AM show.

If a slot changes, for example Heavyweights moving to 4:45 PM, change `start` and rebuild.

**Article dates** are stored in UTC and shown in Detroit time. For example, post 21295 shows as "Oct 5, 2026".

## Switching search indexing on

The preview is deliberately **`noindex`**, because the client's real site is live at woodwardsports.com. When this becomes the production site, change one line in `tools/build.py`, or in `index.html` directly:

```html
<meta name="robots" content="noindex, follow">   →   <meta name="robots" content="index, follow">
```

Then rebuild. `robots.txt` blocks nothing, so the meta tag is the only switch. If the site moves to its own domain, also update `SITE` in `tools/build.py`, which sets the absolute Open Graph and Twitter image URL and `og:url`. Also update the base-path line in `404.html`.

## Advertise contact hook

The "Advertise with WSN" button is `<a data-contact href="https://ig.me/m/woodwardsports">`, an Instagram DM. The secondary link (`data-contact-alt`) opens Facebook Messenger at `https://m.me/WoodwardSports`. To switch to email when the client provides an advertising address, change the `href` to `mailto:…` in `tools/build.py` → `advertise()`. No email address is published anywhere on the site.

## Sources

Every fact comes from `data/content.json`, which was compiled from the following:

- woodwardsports.com and its WordPress REST API: posts, categories and pages.
- The official YouTube channel @WoodwardSports: RSS, the About page and video thumbnails.
- Apple and iTunes lookups: podcasts and the WSN Live! app.
- Spreaker RSS feeds and Spotify show embeds.
- shop.woodwardsports.com: products and prices.

The YouTube figures in the Advertise section (111K subscribers, 163M+ views, 22K+ videos) were read from the channel's About page on 2026-10-08 and are labelled "YouTube, Oct 2026". Shop prices are live "from" prices and may change. No other audience numbers appear on the site.

## Gaps the client must confirm

1. **Advertising contact.** woodwardsports.com/advertise returns 404 and no advertising email is published. The CTA currently points to Instagram DM and Messenger. An email exists, but only as a podcast-feed owner address in `data/content.json` → `contact.email`, and it is intentionally **not** used.
2. **Crunch Time on Spotify.** No Spotify listing was found for the WSN "Crunch Time Sports" feed, so that show has Apple Podcasts and RSS only. The other three shows have Spotify links.
3. **Android app.** The Google Play link in YouTube descriptions returns 404, so only the iOS app (WSN Live!) is shown. Android users are pointed to YouTube Live.
4. These are also not stated anywhere and were not invented:
   - a founding year or company history
   - leadership
   - host bios or headshots, beyond the show art
   - weekend programming
   - what airs in the gaps between shows (shown simply as "Replays")
   - upcoming watch parties. The last one was on 9/17/26, so the section is a recap.

## Before publishing

- `data/content.json` contains `contact.email`, the feed-owner address noted above. GitHub Pages publishes every file in the repo. Either keep `data/` out of the published branch or delete that field.
- Test through a web server, not `file://`, because self-hosted fonts are blocked over `file://`. For example, run `python3 -m http.server` in this folder.
