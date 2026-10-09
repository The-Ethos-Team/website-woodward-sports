#!/usr/bin/env python3
"""Build index.html for the Woodward Sports Network preview site.

Reads data/content.json (facts), data/media.json (local images) and data/shop.json
(merch) and writes ../index.html with every piece of content server-rendered.

    python3 tools/build.py            # rebuild index.html
    python3 tools/build.py --stamp X  # force a cache-busting version string

Python 3.9+ standard library only.
"""
import json, html, sys, datetime, pathlib, re
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'data/content.json').read_text())
MEDIA = json.loads((ROOT / 'data/media.json').read_text())
SHOP = json.loads((ROOT / 'data/shop.json').read_text())
for _p in SHOP:  # typographic apostrophes, like every other string on the page
    _p['title'] = re.sub(r"(\w)'", '\\1’', _p['title'])
DET = ZoneInfo('America/Detroit')
SITE = 'https://website-woodward-sports.vercel.app/'
STAMP = sys.argv[sys.argv.index('--stamp') + 1] if '--stamp' in sys.argv else datetime.datetime.now().strftime('%Y%m%d%H%M')

e = lambda s: html.escape(str(s), quote=True)
NEWTAB = '<span class="sr-only"> (opens in new tab)</span>'


def ext(href, inner, cls='', attrs=''):
    c = f' class="{cls}"' if cls else ''
    return f'<a{c} href="{e(href)}" target="_blank" rel="noopener"{attrs}>{inner}{NEWTAB}</a>'


def det(iso):
    return datetime.datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone(DET)


def fdate(iso, year=True):
    d = det(iso)
    s = d.strftime('%b ') + str(d.day)
    return s + (', ' + str(d.year) if year else '')


def icon(name, cls='ico'):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


SLASHES = '<span class="slashes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>'
DOT = '<i class="dot" aria-hidden="true"></i>'          # ● is not in the web fonts: CSS dot instead
ARROW = '<svg class="ico ico--arrow" aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg>'  # → as inline SVG

# No-break ranges (typography spec 4d): seasons, scores, time ranges, MON–FRI, dates, "5 min read"
NW_RE = re.compile(
    r'(\b\d{4}-\d{2}\b'                                          # 2026-27
    r'|\b\d{2,3}-\d{2,3}\b'                                       # 109-107
    r'|\b\d{1,2}(?::\d{2})?(?:\s?[AP]M)?–\d{1,2}(?::\d{2})?\s?[AP]M(?: ET)?'  # 8–10 AM ET, 8AM–7PM ET
    r'|\bMON–FRI\b'
    r'|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}(?:, \d{4})?'
    r'|\b\d+ min read\b'
    r'|\bRed Wings\b|\bMichigan State\b'                          # team names never split
    r'|\blower-thirds?\b)')


def nw(text):
    """Escape text and wrap ranges that must never split in <span class="nw">."""
    return NW_RE.sub(lambda m: f'<span class="nw">{m.group(0)}</span>', e(text))


TEAM = {  # spec accents: stripe, dot and glow only
    'lions': ('LIONS', 'Lions', '#0076B6'),
    'pistons': ('PISTONS', 'Pistons', '#C8102E'),
    'tigers': ('TIGERS', 'Tigers', '#FA4616'),
    'red-wings': ('RED WINGS', 'Red Wings', '#CE1126'),
    'michigan': ('MICHIGAN', 'Michigan', '#FFCB05'),
    'michigan-state': ('MSU', 'MSU', '#18453B'),
}
SHOW_MEDIA = {v['content_id']: v for v in MEDIA['shows'].values()}
NEWS_MEDIA = {v['post_id']: v for v in MEDIA['news'].values()}
ARTICLES = DATA['articles']
ALL_ARTICLES = {a['id']: a for a in DATA['articles'] + DATA['more_articles']}
SHOWS = DATA['shows']
VIDEOS = DATA['videos']
YT = DATA['youtube_channel']
SOC = DATA['social']


def hosts(s):
    h = s['hosts']
    return ' & '.join(h) if len(h) < 3 else ', '.join(h[:-1]) + ' & ' + h[-1]


def slot_range(s):  # "8–10 AM" (track blocks, phone mock: the ET is said nearby)
    return slot_short(s).removesuffix(' ET')


def slot_short(s):  # "8–10 AM ET"
    def p(t):
        h, m = map(int, t.split(':'))
        return h, m
    (h1, m1), (h2, m2) = p(s['start']), p(s['end'])
    def f(h, m):
        hh = h % 12 or 12
        return f'{hh}' + (f':{m:02d}' if m else '')
    a1, a2 = ('AM' if h1 < 12 else 'PM'), ('AM' if h2 < 12 else 'PM')
    if a1 == a2:
        return f'{f(h1, m1)}–{f(h2, m2)} {a2} ET'
    return f'{f(h1, m1)} {a1}–{f(h2, m2)} {a2} ET'


def replay_for(show):
    vids = [v for v in VIDEOS if v['show'] == show['id']]
    for v in vids:
        if show['short_name'].lower() in v['title'].lower() or show['name'].lower() in v['title'].lower():
            return v
    return vids[0] if vids else VIDEOS[0]


def art(show, size='small'):
    m = SHOW_MEDIA[show['id']]
    return m['file_small'], m['file']


def team_tag(a):
    t = a['teams']
    if len(t) == 1:
        return TEAM[t[0]][1], TEAM[t[0]][2]
    if set(t) == {'michigan', 'michigan-state'}:
        return 'Michigan · MSU', '#FFCB05'
    if len(t) > 1:
        return 'Detroit Sports', '#057D5A'
    if 'Pop Culture' in a['categories']:
        return 'Pop Culture', '#34E0A1'
    return 'Detroit Sports', '#057D5A'


def img_news(a, cls, sizes, lazy=True, ratio=None):
    m = NEWS_MEDIA[a['id']]
    srcset = f"{m['file_small']} {m['w_small']}w, {m['file']} {m['w']}w" if m['file_small'] != m['file'] else f"{m['file']} {m['w']}w"
    lz = 'loading="lazy" ' if lazy else ''
    return (f'<img class="{cls}" src="{m["file_small"]}" srcset="{srcset}" sizes="{sizes}" width="{m["w"]}" height="{m["h"]}" '
            f'alt="" {lz}decoding="async">')


def vid_img(vid, cls, sizes, lazy=True, hero=False):
    base = f'img/videos/{vid}'
    srcset = f'{base}-480.webp 480w, {base}-960.webp 960w' + (f', {base}-1280.webp 1280w' if hero else '')
    extra = 'fetchpriority="high" ' if hero else ('loading="lazy" ' if lazy else '')
    return f'<img class="{cls}" src="{base}-960.webp" srcset="{srcset}" sizes="{sizes}" width="1280" height="720" alt="" {extra}decoding="async">'


# ---------------------------------------------------------------- sections

# Fit-to-width factor per blade title (Anton advance + .01em tracking + plate padding, in em),
# typography spec 4i: font-size = min(--fs-h2, (viewport - gutters) / --bw), so every blade stays one line.
BLADE_W = {'THE LINEUP': 5.3, 'PICK YOUR TEAM': 7.3, 'THE LATEST': 5.3, 'REPLAYS': 4.4, 'TURN IT UP.': 5.4,
           'WATCH PARTIES': 7.0, 'MERCH DROP': 6.0, 'TAKE US WITH YOU': 7.9, 'YOUR BRAND. ON AIR.': 9.0}


def section_head(ch, name, title, sub, hid, paper=False):
    words = title.split(' ')
    last = words[-1]
    head = ' '.join(words[:-1])
    t = (e(head) + ' ' if head else '') + f'<span class="nw">{e(last)}</span>'
    return f'''<header class="sh" data-reveal-head>
      <p class="sh__kicker"><span><b class="sh__ch">CH {ch}</b> — {e(name)}</span></p>
      <h2 class="blade sh__blade" id="{hid}" style="--bw:{BLADE_W.get(title, 5)}"><span class="mask"><span class="mask__in">{t}</span></span></h2>
      {f'<p class="sh__sub">{nw(sub)}</p>' if sub else ''}
    </header>'''


def ticker():
    pick = ARTICLES[:8]
    items = []
    slog = DATA['brand']['slogans']
    def head(a):
        tag, _ = team_tag(a)
        inner = '<em>' + e(tag.upper()) + '</em> ' + e(a['title_display'])
        return f'<li>{ext(a["url"], inner)}</li>'
    seq = [f'<li><span class="tk-live">{DOT}LIVE SHOWS EVERY WEEKDAY <span class="nw">8AM–7PM ET</span></span></li>']
    for i, a in enumerate(pick):
        seq.append(head(a))
        if i == 2:
            seq.append('<li><a class="tk-ad" href="#advertise">THIS SPOT IS AVAILABLE · ADVERTISE WITH WSN</a></li>')
        if i == 4:
            seq.append('<li><span class="tk-slogan">MADE FOR THE FANS, MADE BY THE FANS</span></li>')
    sep = '<li class="tk-sep" aria-hidden="true">/////</li>'
    body = sep.join(seq) + sep
    dup = re.sub(r'<a ', '<a tabindex="-1" ', body)
    return f'''<div class="ticker" role="region" aria-label="Headline ticker" data-ticker>
    <button class="ticker__pause" type="button" aria-pressed="false" data-ticker-toggle><span class="sr-only">Pause ticker</span>{icon("pause", "ico ico--pause")}{icon("play", "ico ico--play")}</button>
    <div class="ticker__view"><div class="ticker__track"><ul class="ticker__list">{body}</ul><ul class="ticker__list" aria-hidden="true">{dup}</ul></div></div>
  </div>'''


def hero():
    latest = VIDEOS[0]
    bes = next(s for s in SHOWS if s['id'] == latest['show'])
    wall_row = ('WOODWARD SPORTS ' * 3).strip()
    rows = ''.join(f'<div class="wall__row" style="--r:{i}"><span>{wall_row}</span><span>{wall_row}</span></div>' for i in range(4))
    return f'''<section id="live" class="hero" aria-labelledby="hero-h">
    <div class="wall" aria-hidden="true">{rows}</div>
    <div class="wrap hero__grid">
      <p class="hero__kicker kicker">{SLASHES}<span class="hero__kick"><span class="live-dot" aria-hidden="true"></span><span class="hk"><span>LIVE SHOWS EVERY WEEKDAY</span><span class="hk__t"><span class="hk__sep"> · </span><span class="nw">8AM–7PM ET</span></span></span></span></p>
      <h1 class="hero__h1" id="hero-h"><span class="ln"><span class="ln__in" style="--i:0">UNFILTERED</span></span> <span class="ln"><span class="ln__in" style="--i:1">DETROIT</span></span> <span class="ln"><span class="ln__in" style="--i:2">SPORTS<span class="h1__dot">.</span></span></span></h1>
      <div class="hero__player">
        <div class="facade" id="facade" data-surf>
          <div class="facade__media" data-surf-content>{vid_img(latest["id"], "facade__img", "(min-width: 1100px) 600px, (min-width: 600px) calc(100vw - 48px), calc(100vw - 32px)", hero=True)}</div>
          <span class="facade__shade" aria-hidden="true"></span>
          <a class="facade__hit" href="{e(latest["url"])}" target="_blank" rel="noopener" data-live-open="facade" data-video="{latest["id"]}"><span class="sr-only" data-facade-label>Play the latest episode: {e(latest["title"])} (opens in new tab)</span></a>
          <span class="bug bug--air" data-airbug aria-hidden="true"><i class="bug__dot"></i><span data-airbug-txt>REPLAY</span></span>
          <span class="bug bug--clock" aria-hidden="true"><span data-clock>ET</span></span>
          <span class="disc" aria-hidden="true">{icon("play")}</span>
          <div class="l3" data-l3 aria-hidden="true">
            <div class="l3__plate blade" data-surf-content>
              <span class="l3__kick" data-l3-kick>LATEST EPISODE</span>
              <span class="l3__name" data-l3-name data-fit>{e(bes["name"])}</span>
              <span class="l3__hosts" data-l3-hosts>{e(hosts(bes))}</span>
              <span class="l3__bar"><i data-l3-progress></i></span>
            </div>
            <div class="l3__side" data-l3-side hidden><span class="l3__lbl" data-l3-lbl>STARTS IN</span><span class="flaps" data-flaps></span></div>
          </div>
          <span class="osd" aria-hidden="true" data-osd></span>
          <span class="surf" aria-hidden="true"><i class="surf__scan"></i><i class="surf__noise"></i></span>
        </div>
      </div>
      <div class="hero__ctas">
        <a class="btn btn--blade btn--xl" href="{e(YT["live_url"])}" target="_blank" rel="noopener" data-live-open>{icon("play")}<span>Watch Live</span><span class="sr-only"> (opens in new tab)</span></a>
        <a class="btn btn--ghost" href="#listen">{icon("listen")}<span>Listen</span></a>
        <a class="btn btn--ghost" href="#lineup">{icon("shows")}<span>Lineup</span></a>
      </div>
      <p class="hero__note">No corporate BS, just real Detroit sports talk.</p>
    </div>
  </section>'''


def lineup():
    rows = []
    gaps = DATA['schedule']['gaps_in_day']
    track_blocks = []
    for i, s in enumerate(SHOWS):
        sm, lg = art(s)
        keys = ' '.join([s['short_name'], hosts(s), s['tagline'], s['slot_display'], s.get('podcast_name', '')])
        h = hosts(s)
        rows.append(f'''<li class="rail__row" data-row="{i}" style="--i:{i}">
          <div class="srow">
            <img class="srow__art" src="{sm}" srcset="{sm} 480w, {lg} 900w" sizes="(min-width: 1100px) 300px, (min-width: 768px) 112px, 80px" width="480" height="480" alt="" loading="lazy" decoding="async">
            <div class="srow__body">
              <p class="srow__slot">{nw(slot_short(s))}<span class="srow__local" data-local="{s["start"]}"></span></p>
              <h3 class="srow__name"><button class="srow__btn" type="button" data-sheet="{s["id"]}" data-find-type="show" data-find-title="{e(s["name"])}" data-find-keys="{e(keys)}">{e(s["name"])}</button></h3>
              <p class="srow__tag">{e(s["tagline"])}</p>
              {f'<p class="srow__hosts">{e(h)}</p>' if h else ''}
            </div>
            <span class="chip chip--later" data-chip>Later</span>
            <span class="srow__more" aria-hidden="true">{icon("chev-r")}</span>
          </div>
        </li>''')
        if i < len(gaps):
            a, b = gaps[i].split('–')
            def lab(t):
                hh = int(t.split(':')[0])
                return f'{hh % 12 or 12}'
            ampm = 'AM' if int(b.split(':')[0]) < 12 else 'PM'
            # content.json: the hours between shows are not described, so the label claims no programming
            rows.append(f'<li class="rail__row rail__row--gap" data-gap="{i}"><span>Between shows · <span class="nw">{lab(a)}–{lab(b)} {ampm}</span></span></li>')
        st = int(s['start'][:2]) + int(s['start'][3:]) / 60
        en = int(s['end'][:2]) + int(s['end'][3:]) / 60
        track_blocks.append(f'<div class="trk__blk" data-blk="{i}" style="--a:{(st - 8) / 11:.4f};--b:{(en - 8) / 11:.4f}"><span class="trk__nm">{e(s["short_name"])}</span><span class="trk__tm">{nw(slot_range(s))}</span></div>')
    hours = ''.join(f'<span style="--x:{k / 11:.4f}">{(8 + k) % 12 or 12}{"A" if 8 + k < 12 else "P"}</span>' for k in range(12))
    gapblk = ''.join(f'<span class="trk__gap" style="--a:{(int(g[:2]) - 8) / 11:.4f};--b:{(int(g[6:8]) - 8) / 11:.4f}" aria-hidden="true">/////</span>' for g in gaps)
    return f'''<section id="lineup" class="sec sec--ink" aria-labelledby="lineup-h">
    <div class="wrap">
      {section_head("02", "LINEUP", "THE LINEUP", "Every take. Every host. All the noise.", "lineup-h")}
      <div class="trk" aria-hidden="true" data-reveal>
        <div class="trk__hours">{hours}</div>
        <div class="trk__lane">{gapblk}{''.join(track_blocks)}<span class="trk__now" data-now hidden><span class="trk__flag" data-now-flag>NOW</span></span></div>
      </div>
      <div class="rail-wrap">
        <ol class="rail" data-rail data-reveal>{''.join(rows)}</ol>
        <span class="rail__head" data-playhead aria-hidden="true" hidden></span>
      </div>
      <p class="smallprint">Weekdays · schedule may change.<span data-tznote></span></p>
    </div>
  </section>'''


def teams():
    tiles = []
    used = set()
    for i, t in enumerate(DATA['teams']):
        big, short, col = TEAM[t['id']]
        ids = t['latest_article_ids']
        aid = next((x for x in ids if x not in used and x in ALL_ARTICLES), ids[0])  # Michigan + MSU share stories
        used.add(aid)
        a = ALL_ARTICLES[aid]
        league = 'NCAA' if t['league'].startswith('NCAA') else t['league']
        keys = ' '.join([t['name'], t['short'], league])
        tiles.append(f'''<li style="--i:{i}"><button class="tile" type="button" data-team="{t["id"]}" style="--team:{col}" data-find-type="team" data-find-title="{e(t["name"])}" data-find-keys="{e(keys)}">
          <span class="tile__league">{league}</span>
          <span class="tile__name">{big}</span>
          <span class="tile__head">{nw(a["title_display"])}</span>
          <span class="tile__go" aria-hidden="true">{icon("chev-r")}</span>
        </button></li>''')
    cats = {c['slug']: c['url'] for c in DATA['categories']}
    leagues = [('NFL', 'nfl'), ('NBA', 'nba'), ('MLB', 'mlb'), ('NHL', 'nhl'), ('NCAA', 'ncaa'), ('Pop Culture', 'pop-culture')]
    chips = ''.join(f'<li>{ext(cats[s], e(l) + icon("ext"), "lchip")}</li>' for l, s in leagues)
    return f'''<section id="teams" class="sec sec--ink2" aria-labelledby="teams-h">
    <div class="wrap">
      {section_head("03", "TEAMS", "PICK YOUR TEAM", "Lions, Pistons, Tigers, Red Wings, Michigan and MSU. Tap a team to filter the latest stories.", "teams-h")}
      <ul class="tiles" data-reveal>{''.join(tiles)}</ul>
      <p class="lchips__lbl lbl" id="lchips-lbl">More on woodwardsports.com</p>
      <ul class="lchips" aria-labelledby="lchips-lbl">{chips}</ul>
    </div>
  </section>'''


def tapes():
    txt = 'UNFILTERED DETROIT SPORTS ///// MADE FOR THE FANS, MADE BY THE FANS ///// LIONS ///// PISTONS ///// TIGERS ///// RED WINGS ///// MICHIGAN ///// MSU ///// '
    seg = f'<span>{txt}</span>'
    return f'''<div class="tapes" data-tapes>
    <div class="tape tape--a" aria-hidden="true"><div class="tape__track">{seg * 2}</div></div>
    <div class="tape tape--b" aria-hidden="true"><div class="tape__track">{seg * 2}</div></div>
    <button class="tapes__pause" type="button" aria-pressed="false" data-tapes-toggle><span class="sr-only">Pause moving tapes</span>{icon("pause", "ico ico--pause")}{icon("play", "ico ico--play")}</button>
  </div>'''


def stories():
    items = []
    for i, a in enumerate(ARTICLES):
        tag, col = team_tag(a)
        kind = 'feature' if i == 0 else ('row' if i < 5 else 'card')
        hidden = ''
        teams_attr = ' '.join(a['teams'])
        keys = ' '.join([a['author'], tag] + [TEAM[t][1] for t in a['teams']])
        if i == 0:
            media = img_news(a, 'st__img', '(min-width: 1100px) 720px, 100vw', lazy=True)
        else:
            media = img_news(a, 'st__img', '(min-width: 1100px) 400px, 96px', lazy=True)
        ring = ' st__dot--ring' if col == '#18453B' else ''
        items.append(f'''<li class="st st--{kind}" data-teams="{teams_attr}" data-idx="{i}"{hidden}>
          <a class="st__a" href="{e(a["url"])}" target="_blank" rel="noopener" data-find-type="story" data-find-title="{e(a["title_display"])}" data-find-keys="{e(keys)}">
            <div class="st__media">{media}</div>
            <div class="st__body">
              <p class="st__tag"><i class="st__dot{ring}" style="--team:{col}"></i><span>{e(tag)}</span><span class="st__sep" aria-hidden="true">·</span><span class="st__min"><span class="nw">{a["reading_minutes"]} min read</span></span></p>
              <h3 class="st__title">{nw(a["title_display"])}</h3>
              <p class="st__by">{e(a["author"])} · <time class="nw" datetime="{e(a["date"])}">{fdate(a["date"])}</time></p>
            </div>{NEWTAB}
          </a>
        </li>''')
    chips = ['<button class="fchip is-on" type="button" aria-pressed="true" data-filter="all">All</button>']
    for t in DATA['teams']:
        chips.append(f'<button class="fchip" type="button" aria-pressed="false" data-filter="{t["id"]}" style="--team:{TEAM[t["id"]][2]}"><i class="fchip__dot"></i>{TEAM[t["id"]][1]}</button>')
    cat = {t['id']: t['category_url'] for t in DATA['teams']}
    return f'''<section id="stories" class="sec sec--paper" aria-labelledby="stories-h" data-cats='{e(json.dumps(cat))}'>
    <div class="wrap">
      {section_head("04", "STORIES", "THE LATEST", "Breaking coverage, inside scoops and raw reactions from the Woodward newsroom. If it’s going down in the 313, it’s dropping here first.", "stories-h")}
    </div>
    <div class="fbar" data-fbar>
      <div class="wrap fbar__in">
        <span class="fbar__count" data-count aria-live="polite">{len(ARTICLES)} stories</span>
        <div class="fchips" role="group" aria-label="Filter stories by team">{''.join(chips)}<span class="fchips__ind" aria-hidden="true"></span></div>
      </div>
    </div>
    <div class="wrap">
      <ol class="stories" id="stories-list" data-reveal>{''.join(items)}</ol>
      <p class="stories__empty" data-empty hidden>No fresh <span data-empty-team></span> stories here. <a data-empty-link href="https://woodwardsports.com/news/" target="_blank" rel="noopener">See all coverage on woodwardsports.com{ARROW}<span class="sr-only"> (opens in new tab)</span></a></p>
      <div class="stories__foot">
        <button class="btn btn--ink" type="button" data-more aria-controls="stories-list" aria-expanded="false" hidden>More stories</button>
        {ext("https://woodwardsports.com/news/", "<span>All stories on woodwardsports.com</span>" + ARROW, "textlink")}
      </div>
    </div>
  </section>'''


def watch():
    cards = []
    shows = {s['id']: s for s in SHOWS}
    for i, v in enumerate(VIDEOS):
        show = shows.get(v['show'])
        tag = 'SHORT' if v['is_short'] else (show['short_name'].upper() if show else 'WSN')
        meta = (show['name'] if show else 'Woodward Sports') + ' · ' + fdate(v['published'], year=False)
        keys = ' '.join([show['name'] if show else '', 'short' if v['is_short'] else 'replay'])
        cards.append(f'''<li class="vrail__item" style="--i:{min(i, 5)}">
          <a class="vcard" href="{e(v["url"])}" target="_blank" rel="noopener" data-video="{v["id"]}" data-show="{v["show"] or ''}" data-find-type="video" data-find-title="{e(v["title"])}" data-find-keys="{e(keys)}">
            <div class="vcard__media">{vid_img(v["id"], "vcard__img", "(min-width: 1100px) 300px, (min-width: 900px) 31vw, (min-width: 600px) 46vw, 82vw")}<span class="vcard__tag">{e(tag)}</span><span class="vcard__play" aria-hidden="true">{icon("play")}</span></div>
            <h3 class="vcard__title">{nw(v["title"])}</h3>
            <p class="vcard__meta">{nw(meta)}</p>{NEWTAB}
          </a>
        </li>''')
    return f'''<section id="watch" class="sec sec--ink" aria-labelledby="watch-h">
    <div class="wrap sh-row">
      {section_head("05", "WATCH", "REPLAYS", "Full shows and clips, fresh off the stream. Tap one to watch it right here.", "watch-h")}
      <div class="railnav" data-railnav>
        <button class="rbtn" type="button" data-rail-prev aria-label="Previous videos">{icon("chev-l")}</button>
        <button class="rbtn" type="button" data-rail-next aria-label="Next videos">{icon("chev-r")}</button>
      </div>
    </div>
    <ul class="vrail" data-vrail data-reveal aria-label="Latest videos">{''.join(cards)}</ul>
    <div class="wrap watch__foot">
      {ext(YT["url"] + "?sub_confirmation=1", icon("yt") + "<span>Subscribe on YouTube</span>", "btn btn--yt")}
      {ext(YT["videos_url"], "<span>All videos on YouTube</span>" + ARROW, "textlink textlink--light")}
    </div>
  </section>'''


def listen():
    rows = []
    for i, s in enumerate(SHOWS):
        sm, lg = art(s)
        ep = s['latest_episodes'][0] if s.get('latest_episodes') else None
        spot = ext(s['spotify'], icon('spotify') + '<span>Spotify</span>', 'btn btn--ghost btn--sm') if s.get('spotify') else ''
        rows.append(f'''<li class="pod" style="--i:{i}">
          <div class="pod__top">
            <img class="pod__art" src="{sm}" width="480" height="480" alt="" loading="lazy" decoding="async">
            <div class="pod__id">
              <h3 class="pod__name">{e(s["podcast_name"])}</h3>
              <p class="pod__meta"><span class="nw">{nw(slot_short(s))} ·</span> <span class="nw">MON–FRI</span></p>
            </div>
            <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          </div>
          {f'<p class="pod__ep"><span class="pod__lbl">Latest</span> {ext(ep["url"], nw(ep["title"]))}</p>' if ep else ''}
          <div class="pod__ctas">
            {ext(s["apple_podcasts"], icon("pod") + "<span>Apple Podcasts</span>", "btn btn--blade btn--sm")}
            {spot}
            {ext(s["rss"], icon("rss") + "<span>RSS</span>", "pod__rss")}
          </div>
        </li>''')
    return f'''<section id="listen" class="sec sec--grad" aria-labelledby="listen-h">
    <div class="wrap">
      {section_head("06", "LISTEN", "TURN IT UP.", "Every show, every weekday, as a podcast. Missed the stream? Take it with you.", "listen-h")}
      <ul class="pods" data-reveal>{''.join(rows)}</ul>
    </div>
  </section>'''


def watch_party():
    wp = DATA['watch_party']
    board = [('HOPCAT', 'WATCH PARTY + POSTGAME', 'win'), ('BAR LOUIE', 'PREGAME SHOW', 'pre'),
             ('ROCK & BREWS', 'STREET TEAM', ''), ("O’TOOLES", 'STREET TEAM', ''), ('FIFTH AVE', 'STREET TEAM', ''), ('BLIND OWL', 'STREET TEAM', '')]
    rows = ''.join(f'<li class="board__row" style="--i:{i}"><span class="board__venue">{e(v)}</span><span class="board__st board__st--{c or "st"}">{e(s)}</span></li>' for i, (v, s, c) in enumerate(board))
    g7 = wp['past_events'][0]
    return f'''<section id="watch-party" class="sec sec--party" aria-labelledby="party-h">
    <picture class="party__bg" aria-hidden="true"><img src="img/atmo-detroit-dusk-1000.webp" srcset="img/atmo-detroit-dusk-1000.webp 1000w, img/atmo-detroit-dusk.webp 2000w" sizes="100vw" width="2000" height="1125" alt="" loading="lazy" decoding="async"></picture>
    <div class="wrap">
      {section_head("07", "ON LOCATION", "WATCH PARTIES", "", "party-h")}
      <div class="party">
        <div class="party__copy">
          <p class="party__recap"><strong>Detroit vs. Buffalo</strong> · Thursday Night Football · <span class="nw">9/17/26</span> · Downtown Royal Oak. Fans voted between 6 bars, and WSN covered <span class="nw">all six.</span></p>
          <div class="board" data-reveal>
            <div class="board__head"><span>Venue</span><span>Royal Oak · Thu 9/17/26</span></div>
            <ol class="board__rows">{rows}</ol>
          </div>
          <p class="party__g7">Before that: the Woodward Heavyweights hosted a {ext(g7["url"], "Pistons–Magic Game 7 watch party")} at Lume’s grand opening in New Buffalo.</p>
          <div class="party__ctas">
            {ext(wp["post_url"], "<span>Read the recap</span>", "btn btn--blade")}
            {ext(SOC["instagram"], "<span>Catch the next vote on Instagram</span>" + ARROW, "textlink textlink--light")}
          </div>
        </div>
        <div class="party__side">
          <figure class="party__fig"><img src="img/party/collage.webp" width="1000" height="563" alt="The six Royal Oak watch-party venues: HopCat, Rock &amp; Brews, O’Tooles, Blind Owl, Fifth Avenue and Bar Louie" loading="lazy" decoding="async"></figure>
          <a class="slot" href="#advertise"><span class="slot__k">Presenting partner</span><span class="slot__v">Available</span><span class="slot__cta">Put your name on the next one{ARROW}</span></a>
        </div>
      </div>
    </div>
  </section>'''


def shop():
    cards = []
    for i, p in enumerate(SHOP):
        price = e(p['price']).replace('.', '<span class="pd">.</span>', 1)  # tnum digits, proportional point
        inner = (f'<div class="prod__img"><img src="{p["image"]}" width="{p["image_w"]}" height="{p["image_h"]}" alt="{e(p["image_alt"])}" loading="lazy" decoding="async"></div>'
                 f'<span class="prod__price">${price}</span><h3 class="prod__title">{e(p["title"])}</h3>')
        cards.append(f'<li style="--i:{min(i, 5)}">{ext(p["url"], inner, "prod")}</li>')
    return f'''<section id="shop" class="sec sec--paper" aria-labelledby="shop-h">
    <div class="wrap">
      {section_head("08", "SHOP", "MERCH DROP", "The official home of Woodward Sports gear. Rep the street sign.", "shop-h")}
      <ul class="prods" data-reveal>{''.join(cards)}</ul>
      <div class="shop__foot">{ext(DATA["shop"]["url"], "<span>Shop all</span>" + ARROW, "btn btn--ink")}<span class="shop__note">Prices from the store · may change</span></div>
    </div>
  </section>'''


def app():
    a = DATA['app']
    return f'''<section id="app" class="sec sec--teal" aria-labelledby="app-h">
    <div class="wrap app">
      <div class="app__copy">
        {section_head("09", "APP", "TAKE US WITH YOU", "Live, anytime, anywhere.", "app-h")}
        <p class="app__txt">{e(a["name"])} delivers all things Detroit sports: the NFL, MLB, NBA, NHL, fantasy football and more, right on your iPhone.</p>
        <div class="app__btns" data-appbtns>
          <a class="app__store" href="{e(a["ios_url"])}" target="_blank" rel="noopener"><img src="img/badges/app-store.svg" width="180" height="60" alt="Download {e(a["name"])} on the App Store">{NEWTAB}</a>
          {ext(YT["live_url"], icon("yt") + "<span>YouTube Live</span>", "btn btn--ghost app__yt")}
        </div>
        <p class="app__fine">iPhone app. Android? Watch on YouTube Live.</p>
      </div>
      <div class="app__stage" data-reveal>
        <div class="phone" aria-hidden="true">
          <div class="phone__screen">
            <div class="phone__status"><span data-phone-time>WSN</span><span class="phone__isl"></span><span>LTE</span></div>
            <div class="phone__bar"><img src="img/logo.svg" width="34" height="34" alt=""><span class="phone__title">WSN LIVE!</span></div>
            <div class="phone__video"><img data-phone-art src="img/videos/{replay_for(SHOWS[0])["id"]}-480.webp" width="480" height="270" alt="" loading="lazy" decoding="async"><span class="bug bug--air" data-airbug><i class="bug__dot"></i><span data-airbug-txt>REPLAY</span></span></div>
            <div class="phone__l3 blade"><span class="phone__kick" data-phone-kick>UP NEXT</span><span class="phone__name" data-phone-name style="--nw:{NAME_FIT[SHOWS[0]["id"]]}">{e(SHOWS[0]["name"])}</span></div>
            <div class="phone__count"><span class="phone__lbl" data-phone-lbl>STARTS IN</span><span class="flaps" data-flaps-phone></span></div>
            <div class="phone__list">{''.join(f'<span><img src="{art(s)[0]}" width="480" height="480" alt="" loading="lazy" decoding="async"><b>{e(s["short_name"])}</b><i>{nw(slot_range(s))}</i></span>' for s in SHOWS)}</div>
            <div class="phone__tabs"><span>{icon("shows")}</span><span>{icon("teams")}</span><span class="is-on">{icon("play")}</span><span>{icon("listen")}</span><span>{icon("shop")}</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>'''


def advertise():
    inv = [('Presenting sponsor', 'Own the stream: your name on the network open, the bug and the lower-thirds of a whole show.'),
           ('Live reads', 'Hosts talk about your brand, live and in their own words, during the show.'),
           ('Bug & lower-third placements', 'Your logo on screen, next to the people Detroit fans tune in for.'),
           ('Ticker', 'Your name in the WSN headline crawl that runs across this site.'),
           ('Podcast ads', 'Pre-roll and mid-roll on all 4 show podcasts.'),
           ('Watch-party activations', 'Put your bar or brand at the center of the next fan watch party.'),
           ('Merch collabs', 'Co-branded drops in the Woodward Sports store.'),
           ('YouTube & social integrations', 'Branded segments, clips and posts across the WSN channels.')]
    cards = ''.join(f'<li class="inv" style="--i:{min(i, 5)}"><span class="inv__n" aria-hidden="true">{i + 1:02d}</span><h3 class="inv__t">{nw(t)}</h3><p class="inv__d">{nw(dsc)}</p></li>' for i, (t, dsc) in enumerate(inv))
    return f'''<section id="advertise" class="sec sec--ink" aria-labelledby="adv-h">
    <div class="wrap">
      {section_head("10", "ADVERTISE", "YOUR BRAND. ON AIR.", "Put your brand inside Detroit’s loudest sports conversation: live every weekday, on demand all week.", "adv-h")}
      <div class="adv">
        <div class="demo" aria-label="Demo: how a sponsor appears on the WSN stream" role="img" data-demo>
          <img class="demo__img" src="img/atmo-arena-bowl-1000.webp" srcset="img/atmo-arena-bowl-1000.webp 1000w, img/atmo-arena-bowl.webp 2000w" sizes="(min-width: 1100px) 640px, 100vw" width="2000" height="1125" alt="" loading="lazy" decoding="async">
          <span class="bug bug--air bug--demo"><i class="bug__dot"></i>LIVE</span>
          <span class="demo__logo"><img src="img/logo.svg" width="56" height="56" alt=""></span>
          <div class="demo__l3 blade"><span class="demo__kick">PRESENTED BY</span><b>YOUR BRAND</b></div>
          <div class="demo__tk"><span class="demo__tkk">SPONSOR</span><span>THIS SPOT IS AVAILABLE<span class="demo__tkx"> · YOUR BRAND HERE</span> /////</span></div>
          <span class="demo__tag">DEMO</span>
        </div>
        <div class="adv__side">
          <dl class="stats">
            <div><dt>Subscribers</dt><dd>111K</dd></div>
            <div><dt>Views</dt><dd>163M+</dd></div>
            <div><dt>Videos</dt><dd>22K+</dd></div>
          </dl>
          <p class="stats__src">YouTube, <span class="nw">Oct 2026</span> · @WoodwardSports</p>
          <div class="adv__cta">
            <a class="btn btn--blade btn--xl" data-contact href="https://ig.me/m/woodwardsports" target="_blank" rel="noopener">{icon("chat")}<span>Advertise with WSN</span><span class="sr-only"> (opens Instagram in a new tab)</span></a>
            <a class="textlink textlink--light" data-contact-alt href="https://m.me/WoodwardSports" target="_blank" rel="noopener"><span>Prefer Messenger? Message us on <span class="nw">Facebook{ARROW}</span></span><span class="sr-only"> (opens in new tab)</span></a>
          </div>
        </div>
      </div>
      <p class="invs__lbl">Ideas to ask us about</p>
      <ol class="invs" data-reveal>{cards}</ol>
    </div>
  </section>'''


def footer():
    socials = [('Instagram', SOC['instagram']), ('YouTube', SOC['youtube']), ('TikTok', SOC['tiktok']), ('Facebook', SOC['facebook']), ('X', SOC['x'])]
    soc = ''.join(f'<li>{ext(u, e(n.upper()), "fsoc")}</li>' for n, u in socials)
    nav = [('Lineup', '#lineup'), ('Teams', '#teams'), ('Stories', '#stories'), ('Replays', '#watch'), ('Listen', '#listen'), ('Watch parties', '#watch-party'), ('Shop', '#shop'), ('App', '#app'), ('Advertise', '#advertise')]
    navh = ''.join(f'<li><a href="{h}">{e(n)}</a></li>' for n, h in nav)
    return f'''<footer class="ftr" aria-labelledby="ftr-h">
    <div class="wrap">
      <h2 class="ftr__big" id="ftr-h">SOUND <span class="nw">OFF<span class="ftr__dot">.</span></span></h2>
      <p class="ftr__handle"><b>{e(SOC["handle"])}</b> everywhere</p>
      <ul class="ftr__soc">{soc}</ul>
      <div class="ftr__grid">
        <div class="ftr__about">
          <img class="ftr__logo" src="img/logo.svg" width="96" height="96" alt="Woodward Sports Network" loading="lazy">
          <p>{e(DATA["brand"]["description"])}</p>
          <p class="ftr__slogan">Made for the fans, made by the fans.</p>
        </div>
        <nav class="ftr__nav" aria-label="Footer"><ul>{navh}</ul></nav>
        <ul class="ftr__ext">
          <li>{ext("https://woodwardsports.com/news/", "All stories")}</li>
          <li>{ext(DATA["shop"]["url"], "Woodward Sports Store")}</li>
          <li>{ext(DATA["app"]["ios_url"], "WSN Live! for iPhone")}</li>
          <li>{ext(YT["membership_url"], "Become a channel member")}</li>
          <li>{ext(DATA["privacy_policy_url"], "Privacy policy")}</li>
        </ul>
      </div>
      <p class="ftr__copy">© 2026 Woodward Sports Network · <span class="nw">Detroit, the 313</span></p>
    </div>
  </footer>'''


SPRITE = '''<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="i-search" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></g></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4.6v14.8a1 1 0 0 0 1.5.86l12.3-7.4a1 1 0 0 0 0-1.72L8.5 3.74A1 1 0 0 0 7 4.6z"/></symbol>
<symbol id="i-pause" viewBox="0 0 24 24"><path fill="currentColor" d="M6 4h4.2v16H6zM13.8 4H18v16h-4.2z"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-chev-l" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/></symbol>
<symbol id="i-chev-r" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></symbol>
<symbol id="i-chev-d" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M5 9l7 7 7-7"/></symbol>
<symbol id="i-shows" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="3" y="6.5" width="18" height="13" rx="2"/><path d="M8 2.8 12 6.5l4-3.7"/></g></symbol>
<symbol id="i-teams" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3z"/></symbol>
<symbol id="i-listen" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 15.5V12a8 8 0 0 1 16 0v3.5"/><rect x="3.5" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16" y="14" width="4.5" height="6.5" rx="1.5"/></g></symbol>
<symbol id="i-shop" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M5 8h14l-1 12.5H6L5 8z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></g></symbol>
<symbol id="i-rss" viewBox="0 0 24 24"><g fill="currentColor"><circle cx="6" cy="18" r="2.1"/><path d="M4 10.4v2.7a6.9 6.9 0 0 1 6.9 6.9h2.7A9.6 9.6 0 0 0 4 10.4zm0-5.3v2.7A12.2 12.2 0 0 1 16.2 20h2.7A14.9 14.9 0 0 0 4 5.1z"/></g></symbol>
<symbol id="i-pod" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></g></symbol>
<symbol id="i-spotify" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9.3"/><path d="M7 9.6c3.5-1 7.4-.7 10.3 1M7.6 12.9c2.9-.8 6-.5 8.3.9M8.2 15.9c2.3-.6 4.6-.4 6.4.7"/></g></symbol>
<symbol id="i-yt" viewBox="0 0 24 24"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z"/></symbol>
<symbol id="i-ext" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M9 7h8v8"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M4 12h15M13.5 6.5 19 12l-5.5 5.5"/></symbol>
<symbol id="i-chat" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" d="M4 5h16v11H9.5L4 20V5z"/></symbol>
</svg>'''


# lower-third fit-to-width: Anton advance width of each show name in em (typography spec §4i)
NAME_FIT = {'big-d-energy': 5.0, 'crunch-time': 5.1, 'braylon-edwards-show': 11.2, 'woodward-heavyweights': 10.3}


def schedule_json():
    shows = []
    for i, s in enumerate(SHOWS):
        r = replay_for(s)
        sm, lg = art(s)
        shows.append({
            'id': s['id'], 'name': s['name'], 'short': s['short_name'], 'start': s['start'], 'end': s['end'],
            'slot': s['slot_display'], 'slotShort': slot_short(s), 'tagline': s['tagline'], 'hosts': s['hosts'],
            'desc': s['description'], 'art': sm, 'artL': lg, 'apple': s['apple_podcasts'], 'spotify': s.get('spotify'),
            'rss': s['rss'], 'spreaker': s['spreaker'], 'page': s['page_url'], 'replay': r['id'], 'replayTitle': r['title'],
            'pod': s['podcast_name'], 'nw': NAME_FIT[s['id']],
        })
    return json.dumps({
        'tz': DATA['schedule']['timezone'], 'days': DATA['schedule']['days'],
        'liveEmbed': 'https://www.youtube.com/embed/live_stream?channel=' + YT['id'] + '&autoplay=1&playsinline=1',
        'vodEmbed': 'https://www.youtube-nocookie.com/embed/{id}?playsinline=1&rel=0&autoplay=1',
        'liveUrl': YT['live_url'], 'latest': VIDEOS[0]['id'], 'shows': shows,
    }, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def ld_json():
    return json.dumps({
        '@context': 'https://schema.org', '@type': 'Organization', 'name': DATA['brand']['name'],
        'alternateName': ['Woodward Sports', 'WSN'], 'url': 'https://woodwardsports.com/',
        'logo': SITE + 'img/logo-512.png', 'description': DATA['brand']['description'],
        'sameAs': [SOC['facebook'], SOC['x'], SOC['instagram'], SOC['tiktok'], SOC['youtube']],
    }, ensure_ascii=False, separators=(',', ':'))


def dialogs():
    return f'''<div class="lr" id="liveroom" role="dialog" aria-modal="true" aria-labelledby="lr-title" hidden>
    <div class="lr__backdrop" data-lr-close></div>
    <div class="lr__sheet">
      <div class="lr__bg" aria-hidden="true"></div>
      <div class="lr__handle" data-lr-drag>
        <span class="lr__grip" aria-hidden="true"></span>
        <h2 class="lr__title" id="lr-title">WSN Live Room</h2>
        <button class="ibtn" type="button" data-lr-min aria-label="Minimize player">{icon("chev-d")}</button>
        <button class="ibtn" type="button" data-lr-close aria-label="Close Live Room">{icon("close")}</button>
      </div>
      <div class="lr__player" data-lr-player>
        <div class="lr__frame" data-lr-frame><img class="lr__poster" data-lr-poster src="img/videos/{VIDEOS[0]["id"]}-960.webp" width="1280" height="720" alt="" loading="lazy" decoding="async"></div>
        <button class="lr__expand" type="button" data-lr-expand hidden><span class="sr-only">Expand player</span></button>
      </div>
      <div class="lr__info">
        <div class="lr__now" data-lr-drag>
          <div class="lr__l3 blade"><span class="lr__kick" data-lr-kick>NOW PLAYING</span><b data-lr-name data-fit>WSN</b><span class="lr__hosts" data-lr-hosts></span></div>
        </div>
        <div class="tabs" role="tablist" aria-label="Live Room">
          <button class="tab" type="button" role="tab" id="lr-tab-live" aria-controls="lr-p-live" aria-selected="true" data-lr-tab="live"><i class="tab__dot"></i>Live</button>
          <button class="tab" type="button" role="tab" id="lr-tab-rep" aria-controls="lr-p-rep" aria-selected="false" data-lr-tab="replays" tabindex="-1">Replays</button>
        </div>
        <div class="lr__panel" role="tabpanel" id="lr-p-live" aria-labelledby="lr-tab-live">
          <p class="lr__msg" data-lr-msg></p>
          <div class="lr__acts">
            <button class="btn btn--ghost btn--sm" type="button" data-lr-latest>{icon("play")}<span>Latest replay</span></button>
            <a class="btn btn--ghost btn--sm" data-lr-listen href="{e(SHOWS[0]["apple_podcasts"])}" target="_blank" rel="noopener">{icon("listen")}<span>Listen instead</span><span class="sr-only"> (Apple Podcasts, opens in new tab)</span></a>
          </div>
        </div>
        <div class="lr__panel" role="tabpanel" id="lr-p-rep" aria-labelledby="lr-tab-rep" hidden>
          <ul class="lr__list" data-lr-list></ul>
        </div>
        <a class="slot slot--sm" href="#advertise" data-close-link><span class="slot__k">Live Room presented by</span><span class="slot__v">Available</span></a>
      </div>
    </div>
    <button class="lr__mclose" type="button" data-lr-close hidden aria-label="Close player">{icon("close")}</button>
  </div>

  <div class="sheet" id="show-sheet" role="dialog" aria-modal="true" aria-labelledby="ss-name" hidden>
    <div class="sheet__backdrop" data-close></div>
    <div class="sheet__panel" data-surf>
      <span class="sheet__grip" aria-hidden="true"></span>
      <button class="ibtn sheet__x" type="button" data-close aria-label="Close">{icon("close")}</button>
      <div class="sheet__body" data-surf-content data-ss-body></div>
      <div class="sheet__nav">
        <button class="rbtn" type="button" data-ss-prev aria-label="Previous show">{icon("chev-l")}</button>
        <span class="sheet__ch" data-ss-ch>CH 01 / 04</span>
        <button class="rbtn" type="button" data-ss-next aria-label="Next show">{icon("chev-r")}</button>
      </div>
      <span class="osd" aria-hidden="true" data-osd></span>
      <span class="surf" aria-hidden="true"><i class="surf__scan"></i><i class="surf__noise"></i></span>
    </div>
  </div>

  <div class="find" id="find" role="dialog" aria-modal="true" aria-label="Find on WSN" hidden>
    <div class="find__backdrop" data-close></div>
    <div class="find__panel">
      <h2 class="sr-only">Find on WSN</h2>
      <div class="find__bar">
        {icon("search")}
        <input id="find-input" type="search" role="combobox" aria-expanded="false" aria-controls="find-results" aria-autocomplete="list" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="Shows, teams, stories…">
        <button class="find__esc" type="button" data-close><span class="find__esc-k" aria-hidden="true">Esc</span><span class="find__esc-t" aria-hidden="true">Close</span><span class="sr-only">Close search</span></button>
      </div>
      <div class="find__body">
        <div class="find__empty" data-find-empty>
          <p class="find__lbl">Teams</p><div class="find__chips" data-find-teams></div>
          <p class="find__lbl">Shows</p><div class="find__chips" data-find-shows></div>
        </div>
        <div id="find-results" role="listbox" aria-label="Results" data-find-results></div>
        <p class="find__none" data-find-none hidden>No matches. Try a team, a show or a host.</p>
      </div>
    </div>
  </div>'''


def page():
    desc = DATA['brand']['description']
    title = 'Woodward Sports Network — Unfiltered Detroit Sports'
    navl = [('Lineup', 'lineup'), ('Teams', 'teams'), ('Stories', 'stories'), ('Watch', 'watch'), ('Listen', 'listen'), ('Shop', 'shop'), ('Advertise', 'advertise')]
    nav = ''.join(f'<li><a href="#{h}" data-nav="{h}">{n}</a></li>' for n, h in navl)
    dock = [('Shows', 'lineup', 'shows'), ('Teams', 'teams', 'teams'), None, ('Listen', 'listen', 'listen'), ('Shop', 'shop', 'shop')]
    dk = []
    for it in dock:
        if it is None:
            dk.append(f'<a class="dock__watch" href="{e(YT["live_url"])}" target="_blank" rel="noopener" data-live-open="dock"><span class="dock__disc">{icon("play")}</span><span class="dock__lbl" data-dock-lbl>Watch</span><span class="sr-only"> live</span></a>')
        else:
            n, h, ic = it
            dk.append(f'<a class="dock__a" href="#{h}" data-dock="{h}">{icon(ic)}<span class="dock__lbl">{n}</span></a>')
    return f'''<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="noindex, follow">
<meta name="theme-color" content="#050F18">
<meta name="color-scheme" content="dark light">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Woodward Sports Network">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{SITE}">
<meta property="og:image" content="{SITE}img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Woodward Sports Network: unfiltered Detroit sports, live every weekday 8AM–7PM ET">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@woodwardsports">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{SITE}img/og-image.jpg">
<link rel="icon" href="img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preload" href="fonts/anton-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/schibsted-grotesk-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/main.css?v={STAMP}">
<script>!function(){{var d=document.documentElement;d.className=d.className.replace('no-js','js v');try{{var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;d.classList.add(rm?'rm':'a');if(!rm&&!location.hash&&!sessionStorage.getItem('wsn-ident'))d.classList.add('intro')}}catch(x){{}}setTimeout(function(){{if(!window.__wsn){{d.classList.add('fs');d.classList.remove('intro','a','v')}}}},5000)}}();</script>
<script type="module" src="js/main.js?v={STAMP}"></script>
<script type="application/ld+json">{ld_json()}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{SPRITE}
<div class="ident" aria-hidden="true" data-ident><span class="ident__p ident__p--l"></span><span class="ident__p ident__p--r"></span><span class="ident__line"></span><span class="ident__logo" data-ident-logo></span></div>
<header class="hdr" data-hdr>
  <div class="hdr__in">
    <a class="hdr__logo" href="#live" aria-label="Woodward Sports Network, back to the top"><img src="img/logo.svg" width="40" height="40" alt=""></a>
    <nav class="hdr__nav" aria-label="Primary"><ul>{nav}</ul><span class="hdr__mark" aria-hidden="true" data-navmark><i></i><i></i><i></i><i></i><i></i></span></nav>
    <span class="hdr__clock" aria-hidden="true"><span data-clock>ET</span></span>
    <a class="pill" href="#lineup" data-pill data-surf><span class="pill__in" data-surf-content><i class="pill__dot"></i><span class="pill__txt" data-pill-txt>WEEKDAYS <span class="nw">8AM–7PM ET</span></span></span></a>
    <button class="hdr__find" type="button" data-find-open aria-keyshortcuts="Meta+K Control+K /">{icon("search")}<span class="hdr__findl">Find</span><kbd>⌘K</kbd><span class="sr-only">: shows, teams, stories, videos</span></button>
    <a class="btn btn--blade hdr__watch" href="{e(YT["live_url"])}" target="_blank" rel="noopener" data-live-open>{icon("play")}<span>Watch Live</span><span class="sr-only"> (opens in new tab)</span></a>
  </div>
  <span class="hdr__prog" aria-hidden="true"></span>
</header>
<main id="main">
  <div class="top">
  {ticker()}
  {hero()}
  </div>
  {lineup()}
  {teams()}
  {tapes()}
  {stories()}
  {watch()}
  {listen()}
  {watch_party()}
  {shop()}
  {app()}
  {advertise()}
</main>
{footer()}
<nav class="dock" aria-label="Quick navigation" data-dock-nav>{''.join(dk)}<i class="dock__bar" aria-hidden="true" data-dock-bar></i></nav>
{dialogs()}
<div class="sr-only" aria-live="polite" data-announce></div>
<script type="application/json" id="schedule">{schedule_json()}</script>
</body>
</html>
'''


out = page()
out = re.sub(r'\n\s*\n', '\n', out)
(ROOT / 'index.html').write_text(out)
print('index.html', len(out.encode()), 'bytes · v=' + STAMP)
