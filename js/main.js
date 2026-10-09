/* Woodward Sports Network — ON AIR ON WOODWARD
   Vanilla ES module. Everything here enhances server-rendered HTML; the page reads without it. */
window.__wsn = 1;
const d = document, H = d.documentElement;
const $ = (s, r = d) => r.querySelector(s);
const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));
const wait = ms => new Promise(r => setTimeout(r, ms));
const mqRM = matchMedia('(prefers-reduced-motion: reduce)');
let RM = mqRM.matches;
H.classList.toggle('rm', RM);
if (RM) H.classList.remove('a');
mqRM.addEventListener?.('change', e => { RM = e.matches; H.classList.toggle('rm', RM); H.classList.toggle('a', !RM && H.classList.contains('v')); });
const mqDesk = matchMedia('(min-width: 1100px)');
const mqWide = matchMedia('(min-width: 900px)');
const mqSm = matchMedia('(min-width: 600px)');
const mqTab = matchMedia('(min-width: 768px)');
/* input modality: overlays opened by touch or mouse get focus without a visible ring */
let kbdNav = false;
addEventListener('keydown', e => { if (!e.metaKey && !e.ctrlKey && !e.altKey) kbdNav = true; }, true);
addEventListener('pointerdown', () => { kbdNav = false; }, true);
const EO = 'cubic-bezier(.16,1,.3,1)', EC = 'cubic-bezier(.7,0,.2,1)';
const SPRING = (CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)'))
  ? 'linear(0,.033,.12 4.4%,.253,.414 9.6%,.746 15.5%,.879,.982 22.1%,1.024 25%,1.048 28.1%,1.056 31.3%,1.054 34.8%,1.029 42.7%,1.009 50.4%,.998 60%,1)'
  : 'cubic-bezier(.34,1.56,.64,1)';
const FS = H.classList.contains('fs');
if (FS) H.classList.remove('intro');
const DATA = JSON.parse($('#schedule').textContent);
const SHOWS = DATA.shows;
const NEWTAB = '<span class="sr-only"> (opens in new tab)</span>';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ico = n => `<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;
const DOT = '<i class="dot" aria-hidden="true"></i>'; // ● is not in the web fonts
/* digits: tabular, zero tracking; colons stay proportional (Schibsted's tnum colon is .635em wide) */
const num = t => esc(t).replace(/\d+(?::\d+)*/g, m => `<span class="n">${m.replace(/:/g, '<span class="cn">:</span>')}</span>`);
const hostsOf = s => s.hosts.length < 3 ? s.hosts.join(' & ') : s.hosts.slice(0, -1).join(', ') + ' & ' + s.hosts.at(-1);
const vibrate = ms => { try { navigator.vibrate?.(ms); } catch (e) { /* no haptics */ } };
const play = (el, kf, o) => { try { return el.animate(kf, o); } catch (e) { return null; } };
const announcer = $('[data-announce]');
const announce = msg => { announcer.textContent = ''; setTimeout(() => { announcer.textContent = msg; }, 60); };

/* ------------------------------------------------------------------ visibility */
const visIO = new IntersectionObserver(es => es.forEach(e => {
  const t = e.target; t._vis = e.isIntersecting; t.classList.toggle('is-off', !e.isIntersecting); t._onVis?.(e.isIntersecting);
}), { rootMargin: '80px 0px' });
['.hero', '[data-ticker]', '.pods', '[data-demo]', '[data-tapes]', '.facade', '.app__stage', '[data-flaps]'].forEach(s => $$(s).forEach(el => visIO.observe(el)));
d.addEventListener('visibilitychange', () => {
  H.classList.toggle('is-hidden', d.hidden);
  if (d.hidden) { clock.stop(); tapes.pause(); } else { clock.start(); tapes.resume(); }
});

/* blades: keep the −20° edge exact for content-sized plates */
const ro = 'ResizeObserver' in window ? new ResizeObserver(es => {
  const todo = es.map(e => [e.target, Math.round(e.borderBoxSize?.[0]?.blockSize ?? e.target.offsetHeight)]);
  requestAnimationFrame(() => todo.forEach(([el, h]) => { if (h && Math.abs((el._h || 0) - h) >= 1) { el._h = h; el.style.setProperty('--h', h + 'px'); } }));
}) : null;
$$('.sh__blade, .l3__plate, .lr__l3').forEach(el => ro?.observe(el));

/* Anton names: shrink to fit the plate (floor 24px), then balance onto two lines */
function fitName(el, avail) {
  if (!el || !(avail > 0)) return;
  el.style.fontSize = '';
  const max = parseFloat(getComputedStyle(el).fontSize), ws = el.style.whiteSpace;
  el.style.whiteSpace = 'nowrap';
  const w = el.scrollWidth;
  el.style.whiteSpace = ws;
  if (w > avail + 1) el.style.fontSize = Math.max(24, Math.floor(max * avail / w * 10) / 10) + 'px';
}
const padX = el => { const c = getComputedStyle(el); return parseFloat(c.paddingLeft) + parseFloat(c.paddingRight); };
function fitL3() {
  const name = $('[data-l3-name]'); if (!name) return;
  const plate = name.parentElement, box = plate.parentElement, side = $('[data-l3-side]', box);
  const inRow = side && !side.hidden && getComputedStyle(box).flexDirection === 'row';
  fitName(name, box.clientWidth - (inRow ? side.offsetWidth + 8 : 0) - padX(plate));
}
function fitLR() {
  const b = $('[data-lr-name]'), plate = b?.parentElement; if (!plate || !plate.getClientRects().length) return;
  fitName(b, plate.parentElement.clientWidth - padX(plate));
}

/* ------------------------------------------------------------------ live logic (America/Detroit) */
const fmt = new Intl.DateTimeFormat('en-US', { timeZone: DATA.tz, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const parts = t => { const o = {}; for (const p of fmt.formatToParts(new Date(t))) o[p.type] = p.value; return { wd: WD.indexOf(o.weekday), y: +o.year, m: +o.month, d: +o.day, h: +o.hour % 24, mi: +o.minute, s: +o.second }; };
function zonedToUtc(y, m, dd, h, mi) {
  const want = Date.UTC(y, m - 1, dd, h, mi); let t = want;
  for (let i = 0; i < 2; i++) { const p = parts(t); t += want - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s); }
  return t;
}
const hm = s => s.split(':').map(Number);
const mins = s => { const [h, m] = hm(s); return h * 60 + m; };
function compute(now) {
  const p = parts(now), cur = p.h * 60 + p.mi + p.s / 60;
  const at = (k, y = p.y, m = p.m, dd = p.d) => { const [h, mi] = hm(k); return zonedToUtc(y, m, dd, h, mi); };
  const chips = SHOWS.map(() => 'later');
  if (DATA.days.includes(p.wd)) {
    for (let i = 0; i < SHOWS.length; i++) {
      const s = SHOWS[i], a = mins(s.start), b = mins(s.end);
      if (cur >= b) { chips[i] = 'done'; continue; }
      if (cur >= a) {
        chips[i] = 'live'; if (i + 1 < SHOWS.length) chips[i + 1] = 'next';
        const start = at(s.start), end = at(s.end);
        return { state: 'live', i, start, end, prog: (now - start) / (end - start), left: end - now, chips, p };
      }
      chips[i] = 'next';
      const start = at(s.start);
      return { state: 'next', i, start, left: start - now, prevEnd: i ? at(SHOWS[i - 1].end) : null, chips, p };
    }
  }
  for (let k = 1; k <= 7; k++) {
    const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + k)), w = dt.getUTCDay();
    if (DATA.days.includes(w)) {
      const start = at(SHOWS[0].start, dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
      return { state: 'off', i: 0, start, left: start - now, wd: w, chips: SHOWS.map((_, j) => j ? 'later' : 'next'), p };
    }
  }
}
const pad = n => String(n).padStart(2, '0');
function cd(ms) {
  let s = Math.max(0, Math.ceil(ms / 1000)); const D = Math.floor(s / 86400); s %= 86400;
  return (D ? D + 'D ' : '') + pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
}
const etFmt = new Intl.DateTimeFormat('en-US', { timeZone: DATA.tz, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
const etShort = new Intl.DateTimeFormat('en-US', { timeZone: DATA.tz, hour: 'numeric', minute: '2-digit', hour12: true });
const clean = s => s.replace(/[  ]/g, ' ');
const clockText = t => clean(etFmt.format(new Date(t))) + ' ET';
/* "8 AM ET", "8:30 AM ET" — same style as the slot ranges ("8–10 AM ET") */
/* no-break spaces: a time never splits across lines */
const firstHour = (s, et = true) => { const [h, m] = hm(s.start); return `${h % 12 || 12}${m ? ':' + pad(m) : ''}\u00A0${h < 12 ? 'AM' : 'PM'}${et ? '\u00A0ET' : ''}`; };
const backAt = (n, et) => `BACK ${WD[n.wd].toUpperCase()} ${firstHour(SHOWS[n.i], et)}`;
const endsIn = ms => { const m = Math.max(1, Math.ceil(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)}H ${pad(m % 60)}M` : `${m}M`; };
function stateLine(n) {
  const s = SHOWS[n.i];
  if (n.state === 'live') return `Live now: ${s.name} with ${hostsOf(s)}, until ${s.slotShort.split('–')[1]}.`;
  if (n.state === 'next') return `Up next: ${s.name} at ${firstHour(s)}.`;
  return `Off air. Back ${WD[n.wd]} ${firstHour(s)} with ${s.name}.`;
}

class Flaps {
  constructor(el) { this.el = el; this.v = ''; this.cells = []; }
  set(v, animate) {
    if (!this.el || v === this.v) return;
    const old = this.v; this.v = v;
    if (old.length !== v.length) return this.build(v);
    for (let i = 0; i < v.length; i++) {
      if (v[i] === old[i]) continue;
      const c = this.cells[i];
      if (c.sep) c.el.textContent = v[i]; else this.flip(c, old[i], v[i], animate && !RM);
    }
  }
  build(v) {
    this.el.textContent = ''; this.cells = [];
    for (const ch of v) {
      const el = d.createElement('span');
      if (/\d/.test(ch)) {
        el.className = 'fl';
        el.innerHTML = `<span class="fl__t">${ch}</span><span class="fl__b">${ch}</span><span class="fl__ft"></span><span class="fl__fb"></span>`;
        const [t, b, ft, fb] = el.children; this.cells.push({ el, t, b, ft, fb });
      } else { el.className = 'fsep'; el.textContent = ch; this.cells.push({ sep: true, el }); }
      this.el.append(el);
    }
  }
  flip(c, a, b, animate) {
    if (!animate) { c.t.textContent = c.b.textContent = b; return; }
    c.t.textContent = b; c.ft.textContent = a; c.b.textContent = a; c.fb.textContent = b;
    c.ft.style.visibility = 'visible';
    const a1 = play(c.ft, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: 130, easing: 'ease-in', fill: 'forwards' });
    if (!a1) { c.b.textContent = b; c.ft.style.visibility = ''; return; }
    a1.onfinish = () => {
      c.ft.style.visibility = ''; c.fb.style.visibility = 'visible';
      const a2 = play(c.fb, [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: 130, easing: 'ease-out', fill: 'forwards' });
      const done = () => { c.b.textContent = b; c.fb.style.visibility = ''; a1.cancel(); a2?.cancel(); };
      if (a2) a2.onfinish = done; else done();
    };
  }
}

/* channel surf: out −6% → scanline → noise → spring in → OSD */
function surf(box, update, osdText) {
  if (!box || RM || box._vis === false || !box.getClientRects().length) { update(); return; }
  const targets = $$('[data-surf-content]', box);
  if (!targets.length) targets.push(box);
  const outs = targets.map(t => play(t, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-6%)', opacity: 0 }], { duration: 120, easing: EC, fill: 'forwards' }));
  Promise.all(outs.map(a => a?.finished)).catch(() => {}).then(() => {
    update();
    play($('.surf__scan', box), [{ transform: 'translateY(-100%)', opacity: 1 }, { transform: 'translateY(340%)', opacity: 1 }], { duration: 260, easing: 'linear' });
    play($('.surf__noise', box), [{ opacity: 0, transform: 'translate(0,0)' }, { opacity: .3, transform: 'translate(-30px,18px)', offset: .5 }, { opacity: 0, transform: 'translate(18px,-30px)' }], { duration: 180, easing: 'steps(4)' });
    targets.forEach((t, k) => {
      play(t, [{ transform: 'translateX(6%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: 40, easing: SPRING, fill: 'backwards' });
      outs[k]?.cancel();
    });
    const osd = $('[data-osd]', box);
    if (osd && osdText) {
      osd.textContent = osdText; osd.getAnimations?.().forEach(a => a.cancel());
      play(osd, [{ opacity: 0 }, { opacity: 1, offset: .08 }, { opacity: 1, offset: .88 }, { opacity: 0 }], { duration: 1200 });
    }
  });
}

/* ------------------------------------------------------------------ renderers */
const pill = $('[data-pill]'), pillTxt = $('[data-pill-txt]');
const clocks = $$('[data-clock]');
const facade = $('#facade'), l3 = $('[data-l3]');
const heroFlaps = new Flaps($('[data-flaps]'));
const phoneFlaps = new Flaps($('[data-flaps-phone]'));
const rows = $$('.rail__row[data-row]'), gapRows = $$('.rail__row[data-gap]');
const playhead = $('[data-playhead]');
const nowLine = $('[data-now]'), nowFlag = $('[data-now-flag]'), lane = $('.trk__lane');
const blks = $$('[data-blk]');
let st = null, lastKey = '', lastHead = 0;
const vidThumb = id => `img/videos/${id}`;
const subs = [];

/* keep the pill text whole when the header runs out of room: drop the Find label first, then the "LIVE · " prefix */
function fitPill() {
  const over = () => pillTxt.scrollWidth > pillTxt.clientWidth + 1;
  H.classList.remove('pill-np', 'pill-nf');
  if (over()) H.classList.add('pill-nf');
  if (over()) H.classList.add('pill-np');
}
function renderPill(n) {
  const s = SHOWS[n.i];
  let txt;
  /* the "LIVE · " / "OFF AIR · " prefix drops where the header is crowded (CSS), the red/ink plate still says it */
  const pre = t => `<span class="pill__pre">${t} · </span>`;
  if (n.state === 'live') txt = pre('LIVE') + esc(s.short.toUpperCase());
  else if (n.state === 'next') txt = n.left <= 15 * 60000 ? 'STARTING SOON' : `UP NEXT ${num(cd(n.left))}`;
  else txt = pre('OFF AIR') + num(backAt(n, false));
  if (pillTxt.innerHTML !== txt) { pillTxt.innerHTML = txt; fitPill(); }
  pill.dataset.state = n.state;
  pill.setAttribute('aria-label', stateLine(n) + (n.state === 'live' ? ' Open the Live Room.' : ' See the lineup.'));
}
subs.push((n, now, changed, prev) => {
  if (changed && prev) surf(pill, () => renderPill(n)); else renderPill(n);
  H.classList.toggle('is-live', n.state === 'live');
  H.classList.toggle('is-next', n.state === 'next');
  H.classList.toggle('is-off', n.state === 'off');
  const ct = clockText(now);
  clocks.forEach(c => { if (!c._typing) c.innerHTML = num(ct); });
});

function setFacadeVideo(id, title, href) {
  const img = $('.facade__img');
  const base = vidThumb(id);
  if (!img.src.includes(id)) { img.srcset = `${base}-480.webp 480w, ${base}-960.webp 960w`; img.src = `${base}-960.webp`; }
  const hit = $('.facade__hit');
  hit.dataset.video = id; hit.href = href || 'https://www.youtube.com/watch?v=' + id;
  $('[data-facade-label]').textContent = title;
}
function renderL3(n, animate) {
  const s = SHOWS[n.i], live = n.state === 'live';
  const name = s.name;
  facade.classList.toggle('is-live', live);
  l3.classList.toggle('is-live', live);
  $('[data-airbug-txt]', facade).textContent = live ? 'LIVE' : 'REPLAY';
  const nm = $('[data-l3-name]'); if (nm.textContent !== name) { nm.textContent = name; nm.style.fontSize = ''; }
  $('[data-l3-hosts]').textContent = hostsOf(s);
  const side = $('[data-l3-side]'), lbl = $('[data-l3-lbl]'), kick = $('[data-l3-kick]');
  side.hidden = false; side.classList.toggle('is-off', n.state === 'off');
  if (live) {
    kick.innerHTML = `${DOT}LIVE NOW · ${esc(s.slotShort)}`;
    lbl.textContent = 'ENDS IN';
    heroFlaps.el.hidden = true;
    let e = $('.l3__ends', side); if (!e) { e = d.createElement('span'); e.className = 'l3__ends'; side.append(e); }
    e.hidden = false; e.innerHTML = num(endsIn(n.left));
    $('[data-l3-progress]').style.setProperty('--p', Math.min(1, Math.max(0, n.prog)).toFixed(4));
    setFacadeVideo(s.replay, `Watch ${s.name} live now (opens in new tab)`, DATA.liveUrl);
  } else {
    const soon = n.state === 'next' && n.left <= 15 * 60000;
    kick.textContent = n.state === 'next' ? `${soon ? 'STARTING SOON' : 'UP NEXT'} · ${s.slotShort}` : `OFF AIR · ${backAt(n, true)}`;
    lbl.textContent = n.state === 'next' ? 'STARTS IN' : 'BACK IN';
    $('.l3__ends', side)?.setAttribute('hidden', '');
    heroFlaps.el.hidden = false;
    heroFlaps.set(cd(n.left), animate && facade._vis !== false);
    setFacadeVideo(DATA.latest, 'Play the latest replay in the Live Room');
  }
  fitL3();
}
subs.push((n, now, changed, prev) => {
  if (changed && prev) {
    surf(facade, () => renderL3(n, false), `CH ${pad(n.i + 1)} › ${SHOWS[n.i].name.toUpperCase()}`);
  } else renderL3(n, true);
});

function renderRail(n, now, force) {
  rows.forEach((r, i) => {
    const c = n.chips[i];
    r.classList.toggle('is-live', c === 'live'); r.classList.toggle('is-next', c === 'next'); r.classList.toggle('is-done', c === 'done');
    const chip = $('[data-chip]', r);
    chip.className = 'chip chip--' + c;
    chip.innerHTML = c === 'live' ? `${DOT}Live` : c[0].toUpperCase() + c.slice(1);
    blks[i]?.classList.toggle('is-live', c === 'live'); blks[i]?.classList.toggle('is-done', c === 'done');
  });
  if (!force && now - lastHead < 30000) return;
  lastHead = now;
  // mobile playhead on the Day Rail
  let row = null, f = 0;
  if (n.state === 'live') { row = rows[n.i]; f = n.prog; }
  else if (n.state === 'next') {
    if (n.prevEnd) { row = gapRows[n.i - 1]; f = (now - n.prevEnd) / (n.start - n.prevEnd); } else { row = rows[0]; f = 0; }
  }
  if (row && !mqWide.matches) {
    playhead.hidden = false;
    playhead.style.setProperty('--y', (row.offsetTop + Math.min(1, Math.max(0, f)) * row.offsetHeight) + 'px');
  } else playhead.hidden = true;
  // desktop NOW line on the 8A–7P track
  const p = n.p, hrs = p.h + p.mi / 60;
  if (DATA.days.includes(p.wd) && hrs >= 8 && hrs <= 19 && lane) {
    nowLine.hidden = false;
    nowLine.style.setProperty('--nx', ((hrs - 8) / 11 * lane.clientWidth).toFixed(1) + 'px');
    nowFlag.innerHTML = num('NOW ' + clean(etShort.format(new Date(now))).replace(/ (AM|PM)/, ''));
  } else nowLine.hidden = true;
}
subs.push((n, now, changed) => renderRail(n, now, changed));

subs.push((n, now) => {
  const s = SHOWS[n.i], live = n.state === 'live';
  $('[data-dock-lbl]').textContent = live ? 'Live' : 'Watch';
  // phone mock
  const art = $('[data-phone-art]');
  const thumb = `img/videos/${s.replay}-480.webp`;
  if (art && !art.src.endsWith(thumb)) art.src = thumb;
  $('.phone__video')?.classList.toggle('is-live', live);
  const pt = $('[data-phone-time]'); if (pt) pt.innerHTML = num(clean(etShort.format(new Date(now))).replace(/ (AM|PM)/, ''));
  const pk = $('[data-phone-kick]'), pn = $('[data-phone-name]'), pl = $('[data-phone-lbl]');
  if (pk) {
    pk.innerHTML = live ? `${DOT}LIVE NOW` : n.state === 'next' ? (n.left <= 15 * 60000 ? 'STARTING SOON' : 'UP NEXT') : `OFF AIR · ${backAt(n, false)}`;
    pn.textContent = s.name; pn.style.setProperty('--nw', s.nw);
    pl.textContent = live ? 'ENDS IN' : n.state === 'next' ? 'STARTS IN' : 'BACK IN';
    $('.phone__count').classList.toggle('is-live', live);
    phoneFlaps.set(cd(n.left), $('.app__stage')._vis === true);
    $('.phone__video [data-airbug-txt]').textContent = live ? 'LIVE' : 'REPLAY';
  }
});

const clock = {
  timer: 0,
  tick() {
    const now = Date.now(), n = compute(now), key = n.state + n.i, changed = key !== lastKey, prev = st;
    st = n;
    for (const f of subs) { try { f(n, now, changed, prev); } catch (e) { console.warn(e); } }
    if (changed && prev) announce(stateLine(n));
    lastKey = key;
  },
  start() { clearTimeout(this.timer); this.tick(); const loop = () => { this.timer = setTimeout(() => { this.tick(); loop(); }, 1000 - Date.now() % 1000); }; loop(); },
  stop() { clearTimeout(this.timer); },
};

/* local times when the visitor is not on Detroit time */
function localTimes() {
  const now = Date.now(), p = parts(now);
  const det = (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(now / 1000) * 1000) / 60000;
  const loc = -new Date(now).getTimezoneOffset();
  if (Math.abs(det - loc) < 1) return;
  const lf = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  $$('[data-local]').forEach(el => {
    const [h, m] = hm(el.dataset.local);
    el.textContent = clean(lf.format(new Date(zonedToUtc(p.y, p.m, p.d, h, m)))) + ' your time';
  });
  const tz = $('[data-tznote]'); if (tz) tz.textContent = ' All times ET (Detroit), with your local time underneath.';
}

/* ------------------------------------------------------------------ header, nav, dock */
const hdr = $('[data-hdr]');
let hdrTick = false;
addEventListener('scroll', () => {
  if (hdrTick) return; hdrTick = true;
  requestAnimationFrame(() => { hdr.classList.toggle('is-solid', scrollY > 24); hdrTick = false; });
}, { passive: true });
hdr.classList.toggle('is-solid', scrollY > 24);

const dockNav = $('[data-dock-nav]'), dockBar = $('[data-dock-bar]');
const navMark = $('[data-navmark]');
const DOCK_MAP = { lineup: 'lineup', teams: 'teams', stories: 'teams', listen: 'listen', shop: 'shop' };
const NAV_MAP = { lineup: 'lineup', teams: 'teams', stories: 'stories', watch: 'watch', listen: 'listen', shop: 'shop', advertise: 'advertise' };
let curSec = '';
function markNav() {
  const dk = DOCK_MAP[curSec], a = dk && $(`[data-dock="${dk}"]`);
  $$('[data-dock]').forEach(x => x.classList.toggle('is-on', x === a));
  if (a) { dockBar.style.setProperty('--bx', (a.offsetLeft + a.offsetWidth / 2 - 10) + 'px'); dockBar.classList.add('is-on'); } else dockBar.classList.remove('is-on');
  const nk = NAV_MAP[curSec], l = nk && $(`[data-nav="${nk}"]`);
  $$('[data-nav]').forEach(x => { x.classList.toggle('is-on', x === l); if (x === l) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
  if (l && navMark) { navMark.style.setProperty('--mx', (l.offsetLeft + (l.offsetWidth - 30) / 2) + 'px'); navMark.classList.add('is-on'); } else navMark?.classList.remove('is-on');
}
const secIO = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { curSec = e.target.id; markNav(); } });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id], .top > section[id]').forEach(s => secIO.observe(s));

addEventListener('focusin', e => { if (e.target.matches('input, textarea')) H.classList.add('kb'); });
addEventListener('focusout', e => { if (e.target.matches('input, textarea')) H.classList.remove('kb'); });

/* ------------------------------------------------------------------ ticker */
const ticker = $('[data-ticker]');
function tickerSpeed() {
  const list = $('.ticker__list', ticker); if (!list) return;
  $('.ticker__track', ticker).style.setProperty('--tk-dur', (list.offsetWidth / 90).toFixed(1) + 's');
}
$('[data-ticker-toggle]').addEventListener('click', e => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', on); ticker.classList.toggle('is-paused', on);
  $('.sr-only', e.currentTarget).textContent = on ? 'Play ticker' : 'Pause ticker';
});

/* ------------------------------------------------------------------ crossed tapes (scroll-velocity playbackRate) */
const tapes = (() => {
  const root = $('[data-tapes]'), btn = $('[data-tapes-toggle]');
  let anims = [], user = false, rate = 1, vel = 0, lastY = scrollY, lastT = performance.now(), raf = 0;
  function make() {
    if (RM || anims.length || !root) return;
    anims = $$('.tape__track', root).map((t, k) => play(t, k ? [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }] : [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 40000, iterations: Infinity })).filter(Boolean);
    if (root._vis === false || user) anims.forEach(a => a.pause());
  }
  function loop() {
    raf = 0;
    vel *= (1 - .08);
    const target = (vel >= 0 ? 1 : -1) * (1 + Math.min(Math.abs(vel) / 1.5, 3));
    rate += (target - rate) * .08;
    anims.forEach(a => { a.playbackRate = rate; });
    if (Math.abs(rate - 1) > .005 || Math.abs(vel) > .01) raf = requestAnimationFrame(loop);
    else { rate = 1; anims.forEach(a => { a.playbackRate = 1; }); }
  }
  addEventListener('scroll', () => {
    const t = performance.now(), y = scrollY, dt = Math.max(1, t - lastT);
    const v = (y - lastY) / dt; lastY = y; lastT = t;
    if (!anims.length || user || root._vis === false) return;
    vel = Math.abs(v) > Math.abs(vel) ? v : vel;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  if (root) root._onVis = vis => { if (user) return; anims.forEach(a => vis ? a.play() : a.pause()); };
  btn?.addEventListener('click', () => {
    user = !user; btn.setAttribute('aria-pressed', user);
    $('.sr-only', btn).textContent = user ? 'Play moving tapes' : 'Pause moving tapes';
    anims.forEach(a => user ? a.pause() : a.play());
  });
  return { make, pause() { anims.forEach(a => a.pause()); }, resume() { if (!user && root?._vis !== false) anims.forEach(a => a.play()); } };
})();

/* ------------------------------------------------------------------ reveals */
const headIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; e.target.classList.add('is-in'); headIO.unobserve(e.target);
}), { threshold: .35, rootMargin: '0px 0px -10% 0px' });
const grpIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const t = e.target; t.classList.add('is-in'); grpIO.unobserve(t);
  setTimeout(() => t.classList.add('rv-done'), 1400);
}), { threshold: .1, rootMargin: '0px 0px -10% 0px' });
function initReveals() {
  if (FS) { $$('[data-reveal-head], [data-reveal]').forEach(el => el.classList.add('is-in', 'rv-done')); return; }
  $$('[data-reveal-head]').forEach(el => headIO.observe(el));
  $$('[data-reveal]').forEach(el => grpIO.observe(el));
}
const rvStyle = d.createElement('style');
rvStyle.textContent = '[data-reveal].rv-done>*{animation:none!important}';
d.head.append(rvStyle);

/* ------------------------------------------------------------------ ident + hero entrance */
let heroStarted = false;
function typeIn(el) {
  if (!el) return;
  el._typing = true;
  const full = clockText(Date.now()); el.textContent = '';
  [...full].forEach((_, i) => setTimeout(() => { el.innerHTML = num(full.slice(0, i + 1)); if (i === full.length - 1) el._typing = false; }, i * 30));
}
function startHero() {
  if (heroStarted) return; heroStarted = true;
  if (RM || FS) return;
  $('.hero').classList.add('is-in');
  setTimeout(() => typeIn($('.facade [data-clock]')), 300);
}
async function ident() {
  const root = $('[data-ident]');
  if (!H.classList.contains('intro') || !root || RM) { H.classList.remove('intro'); root?.remove(); startHero(); return; }
  root.style.animation = 'none';
  try { sessionStorage.setItem('wsn-ident', '1'); } catch (e) { /* private mode */ }
  let done = false;
  const timers = [], anims = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  const finish = () => {
    if (done) return; done = true;
    timers.forEach(clearTimeout); anims.forEach(a => { try { a.finish(); } catch (e) { /* noop */ } });
    removeEventListener('pointerdown', finish, true); removeEventListener('keydown', finish, true);
    H.classList.remove('intro');
    startHero();
    const out = play(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    (out ? out.finished : Promise.resolve()).then(() => root.remove(), () => root.remove());
  };
  addEventListener('pointerdown', finish, true); addEventListener('keydown', finish, true);
  let svg = '';
  try { svg = await Promise.race([fetch('img/logo.svg').then(r => r.ok ? r.text() : ''), wait(900).then(() => '')]); } catch (e) { svg = ''; }
  await Promise.race([d.fonts?.ready, wait(500)]);
  if (done) return;
  if (!svg) { finish(); return; }
  const logo = $('[data-ident-logo]');
  logo.innerHTML = svg;
  const el = $('svg', logo); el?.removeAttribute('role'); el?.setAttribute('aria-hidden', 'true');
  const push = a => a && anims.push(a);
  push(play($('.ident__line', root), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 260, easing: EC, fill: 'forwards' }));
  push(play(logo, [
    { transform: 'rotate(-14deg) translateY(-24px)', opacity: 0, easing: 'ease-out' },
    { transform: 'rotate(5deg)', opacity: 1, offset: .45, easing: 'ease-in-out' },
    { transform: 'rotate(-2.5deg)', offset: .7, easing: 'ease-in-out' },
    { transform: 'rotate(1deg)', offset: .85, easing: 'ease-in-out' },
    { transform: 'rotate(0deg)', opacity: 1 }], { duration: 700, delay: 120, fill: 'both' }));
  const sb = $('#sign-bottom', logo), net = $('#network', logo);
  push(sb && play(sb, [{ transform: 'rotate(-7deg)' }, { transform: 'rotate(3deg)', offset: .5 }, { transform: 'rotate(-1deg)', offset: .8 }, { transform: 'rotate(0deg)' }], { duration: 760, delay: 200, easing: 'ease-out', fill: 'both' }));
  push(net && play(net, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 520, easing: EO, fill: 'both' }));
  later(880, () => {
    push(play($('.ident__p--l', root), [{ transform: 'none' }, { transform: 'translateX(-100%)' }], { duration: 420, easing: EC, fill: 'forwards' }));
    push(play($('.ident__p--r', root), [{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 420, easing: EC, fill: 'forwards' }));
    push(play($('.ident__line', root), [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
    const tgt = $('.hdr__logo img').getBoundingClientRect(), f = logo.getBoundingClientRect();
    const dx = (tgt.left + tgt.width / 2) - (f.left + f.width / 2), dy = tgt.top - f.top, s = tgt.width / f.width;
    push(play(logo, [{ transform: 'none' }, { transform: `translate(${dx}px,${dy}px) scale(${s})` }], { duration: 520, easing: EO, fill: 'forwards' }));
  });
  later(900, startHero);
  later(1420, finish);
}

/* ------------------------------------------------------------------ dialogs */
const stack = [];
const FOCUSABLE = 'a[href], button:not([disabled]):not([hidden]), input, [tabindex]:not([tabindex="-1"])';
function setInert(on) { ['main', '.ftr', '.hdr', '.dock'].forEach(s => { const el = $(s); if (el) el.inert = on; }); }
function lock(on) { H.classList.toggle('is-locked', on); H.classList.toggle('is-overlay', on); setInert(on); }
function openDialog(el, opener, focusEl) {
  el.hidden = false; el._opener = opener || d.activeElement;
  if (!stack.includes(el)) stack.push(el);
  lock(true);
  (focusEl || $(FOCUSABLE, el))?.focus({ preventScroll: true });
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
}
function closeDialog(el, returnFocus = true) {
  el.classList.remove('is-open');
  const i = stack.indexOf(el); if (i > -1) stack.splice(i, 1);
  if (!stack.length) lock(false);
  setTimeout(() => { if (!el.classList.contains('is-open')) el.hidden = true; }, RM ? 160 : 430);
  if (returnFocus && el._opener?.isConnected) el._opener.focus({ preventScroll: true });
}
addEventListener('keydown', e => {
  const top = stack.at(-1);
  if (e.key === 'Escape' && top) { e.preventDefault(); top === LR ? closeLive() : closeDialog(top); return; }
  if (e.key === 'Tab' && top) {
    const f = $$(FOCUSABLE, top).filter(x => x.getClientRects().length && !x.closest('[hidden]'));
    if (!f.length) return;
    const first = f[0], last = f.at(-1);
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!top.contains(d.activeElement)) { e.preventDefault(); first.focus(); }
  }
});
d.addEventListener('click', e => {
  const c = e.target.closest('[data-close]');
  if (c) { const dlg = c.closest('.sheet, .find'); if (dlg) closeDialog(dlg); }
  const cl = e.target.closest('[data-close-link]');
  if (cl) { const dlg = cl.closest('.sheet, .find, .lr'); if (dlg === LR) closeLive(false); else if (dlg) closeDialog(dlg, false); }
});

/* ------------------------------------------------------------------ show sheet */
const SH = $('#show-sheet'), shBody = $('[data-ss-body]'), shPanel = $('.sheet__panel', SH);
let shIdx = 0;
function renderSheet(i) {
  shIdx = (i + SHOWS.length) % SHOWS.length;
  const s = SHOWS[shIdx], chip = st ? st.chips[shIdx] : 'later', live = chip === 'live';
  const h = hostsOf(s);
  shBody.innerHTML = `<div class="ss">
    <div class="ss__top">
      <img class="ss__art" src="${esc(s.artL)}" width="900" height="900" alt="${esc(s.name)} show art">
      <div><p class="ss__ch">CH ${pad(shIdx + 1)} · <span class="nw">${esc(s.slotShort)}</span></p>
        <h2 class="ss__name" id="ss-name">${esc(s.name)}</h2>
        <p class="ss__tag">${esc(s.tagline)}</p>
        ${h ? `<p class="ss__hosts">${esc(h)}</p>` : ''}
        <span class="chip chip--${chip}">${live ? DOT + 'Live now' : chip}</span></div>
    </div>
    <p class="ss__desc">${esc(s.desc)}</p>
    <div class="ss__ctas">
      <button class="btn btn--blade" type="button" data-ss-watch>${ico('play')}<span>${live ? 'Watch live' : 'Watch latest episode'}</span></button>
      <a class="btn btn--ghost btn--sm" href="${esc(s.apple)}" target="_blank" rel="noopener">${ico('pod')}<span>Apple Podcasts</span>${NEWTAB}</a>
      ${s.spotify ? `<a class="btn btn--ghost btn--sm" href="${esc(s.spotify)}" target="_blank" rel="noopener">${ico('spotify')}<span>Spotify</span>${NEWTAB}</a>` : ''}
      <a class="pod__rss" href="${esc(s.rss)}" target="_blank" rel="noopener">${ico('rss')}<span>RSS</span>${NEWTAB}</a>
    </div>
    <a class="slot slot--sm" href="#advertise" data-close-link><span class="slot__k">${esc(s.short)} presented by</span><span class="slot__v">Available</span></a>
  </div>`;
  $('[data-ss-ch]').textContent = `CH ${pad(shIdx + 1)} / ${pad(SHOWS.length)}`;
  $('[data-ss-watch]', shBody).addEventListener('click', () => {
    const op = SH._opener; closeDialog(SH, false);
    openLive({ opener: op, video: live ? null : s.replay, from: 'sheet' });
  });
}
function openSheet(i, opener) {
  renderSheet(i); openDialog(SH, opener, $('.sheet__x', SH));
  /* one steady height while paging: size the panel to the tallest show so the grip, X and nav never jump */
  shPanel.style.minHeight = '';
  let tall = 0;
  SHOWS.forEach((_, k) => { renderSheet(k); tall = Math.max(tall, shPanel.offsetHeight); });
  renderSheet(i);
  if (tall) shPanel.style.minHeight = tall + 'px';
}
function surfSheet(dir) {
  vibrate(8);
  const ni = (shIdx + dir + SHOWS.length) % SHOWS.length;
  surf(shPanel, () => renderSheet(ni), `CH ${pad(ni + 1)} › ${SHOWS[ni].name.toUpperCase()}`);
}
$('[data-ss-prev]').addEventListener('click', () => surfSheet(-1));
$('[data-ss-next]').addEventListener('click', () => surfSheet(1));
SH.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') surfSheet(-1); if (e.key === 'ArrowRight') surfSheet(1); });
(() => {
  let s0 = null;
  const start = (x, y, t) => { s0 = { x, y, t }; };
  const end = (x, y, t) => {
    if (!s0) return; const dx = x - s0.x, dy = y - s0.y, v = Math.abs(dx) / Math.max(1, t - s0.t); s0 = null;
    if ((Math.abs(dx) > 60 || (v > .5 && Math.abs(dx) > 20)) && Math.abs(dx) > 1.5 * Math.abs(dy)) surfSheet(dx < 0 ? 1 : -1);
  };
  shPanel.addEventListener('touchstart', e => { const t = e.touches[0]; if (e.touches.length === 1) start(t.clientX, t.clientY, e.timeStamp); else s0 = null; }, { passive: true });
  shPanel.addEventListener('touchend', e => { const t = e.changedTouches[0]; end(t.clientX, t.clientY, e.timeStamp); }, { passive: true });
  shPanel.addEventListener('touchcancel', () => { s0 = null; }, { passive: true });
  shPanel.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && !e.button && !e.target.closest('a, button')) start(e.clientX, e.clientY, e.timeStamp); });
  shPanel.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') end(e.clientX, e.clientY, e.timeStamp); });
})();
$$('[data-sheet]').forEach(b => b.addEventListener('click', () => openSheet(SHOWS.findIndex(s => s.id === b.dataset.sheet), b)));

/* ------------------------------------------------------------------ stories filter + team morph */
const list = $('#stories-list');
const items = $$('.st', list);
const cats = JSON.parse($('#stories').dataset.cats || '{}');
const chipsEl = $('.fchips'), ind = $('.fchips__ind');
let filter = 'all', expanded = false;
const LIMIT = () => mqWide.matches ? 8 : mqTab.matches ? 7 : 6;
const kindOf = it => it.classList.contains('st--feature') ? 'f' : it.classList.contains('st--row') ? 'r' : 'c';
function layout(vis) {
  vis.forEach((it, k) => {
    const kind = k === 0 ? 'feature' : k < 5 ? 'row' : 'card';
    it.classList.remove('st--feature', 'st--row', 'st--card'); it.classList.add('st--' + kind);
    const img = $('.st__img', it);
    img.sizes = kind === 'feature' ? '(min-width: 900px) 58vw, 100vw' : kind === 'card' ? '(min-width: 900px) 31vw, 128px' : '(min-width: 1100px) 136px, 128px';
  });
}
function moveInd(btn, animate) {
  if (!btn || !ind) return;
  const x = btn.offsetLeft, w = btn.offsetWidth, px = ind._x ?? x, pw = ind._w ?? w;
  ind.style.width = w + 'px'; ind.style.transform = `translateX(${x}px)`;
  if (animate && !RM && (px !== x || pw !== w)) play(ind, [{ transform: `translateX(${px}px) scaleX(${pw / w})` }, { transform: `translateX(${x}px) scaleX(1)` }], { duration: 420, easing: SPRING });
  ind._x = x; ind._w = w;
  const target = x - (chipsEl.clientWidth - w) / 2;
  if (animate) chipsEl.scrollTo({ left: Math.max(0, target), behavior: RM ? 'auto' : 'smooth' });
}
/* chip strip: edge fades only where there is more to scroll */
function chipFade() {
  if (!chipsEl) return;
  const max = chipsEl.scrollWidth - chipsEl.clientWidth;
  chipsEl.classList.toggle('is-scrolled', chipsEl.scrollLeft > 2);
  chipsEl.classList.toggle('at-end', chipsEl.scrollLeft >= max - 2);
}
/* scroll cue: when a chip happens to end right at the edge (440 px), the next one hides wholly under the fade and
   the row looks finished. Widen the gaps just enough that the last visible chip runs into the fade instead. */
function chipPeek() {
  if (!chipsEl) return;
  chipsEl.style.removeProperty('--cg');
  const cs = [...chipsEl.querySelectorAll('.fchip')], edge = chipsEl.clientWidth - 4;
  if (chipsEl.scrollWidth <= chipsEl.clientWidth + 1) return;
  const k = cs.findIndex(c => c.offsetLeft + c.offsetWidth > edge);
  if (k < 2 || cs[k].offsetLeft < edge - 36) return;
  const prev = cs[k - 1], shift = edge + 28 - (prev.offsetLeft + prev.offsetWidth);
  chipsEl.style.setProperty('--cg', (2 + shift / (k - 1)).toFixed(1) + 'px');
}
chipsEl?.addEventListener('scroll', () => requestAnimationFrame(chipFade), { passive: true });
function applyStories(animate) {
  const match = it => filter === 'all' || it.dataset.teams.split(' ').includes(filter);
  const all = items.filter(match), next = all.slice(0, expanded ? Infinity : LIMIT()), nextSet = new Set(next);
  const cur = items.filter(it => !it.hidden);
  $('[data-count]').textContent = `${all.length} ${all.length === 1 ? 'story' : 'stories'}`;
  const more = $('[data-more]');
  more.hidden = all.length <= next.length; more.setAttribute('aria-expanded', String(expanded));
  const empty = $('[data-empty]'); empty.hidden = all.length > 0;
  if (!all.length) {
    const btn = $(`.fchip[data-filter="${filter}"]`);
    $('[data-empty-team]').textContent = btn ? btn.textContent.trim() : '';
    if (cats[filter]) $('[data-empty-link]').href = cats[filter];
  }
  const r = list.getBoundingClientRect();
  if (!animate || RM || r.bottom < 0 || r.top > innerHeight) {
    items.forEach(it => { it.hidden = !nextSet.has(it); }); layout(next); return;
  }
  const leaving = cur.filter(it => !nextSet.has(it));
  const first = new Map(cur.map(it => [it, [it.getBoundingClientRect(), kindOf(it)]]));
  Promise.all(leaving.map(it => play(it, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 160, easing: EC, fill: 'forwards' })?.finished)).catch(() => {}).then(() => {
    leaving.forEach(it => { it.hidden = true; it.getAnimations?.().forEach(a => a.cancel()); });
    next.forEach(it => { it.hidden = false; });
    layout(next);
    let k = 0;
    next.forEach(it => {
      const f = first.get(it);
      if (f && f[1] === kindOf(it)) {
        const l = it.getBoundingClientRect(), dx = f[0].left - l.left, dy = f[0].top - l.top;
        if (Math.abs(dx) + Math.abs(dy) > 1) play(it, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 380, easing: EO });
      } else play(it, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 30 * k++, easing: EO, fill: 'backwards' });
    });
  });
}
function setFilter(team, opts = {}) {
  if (!$(`.fchip[data-filter="${team}"]`)) team = 'all';
  const changed = team !== filter; filter = team;
  $$('.fchip').forEach(b => { const on = b.dataset.filter === team; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
  moveInd($(`.fchip[data-filter="${team}"]`), true);
  if (changed) { vibrate(8); applyStories(true); }
  if (opts.scroll) $('#stories').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
}
$$('.fchip').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
$('[data-more]').addEventListener('click', () => { expanded = true; applyStories(true); });
$$('[data-team]').forEach(t => t.addEventListener('click', () => setFilter(t.dataset.team, { scroll: true })));

/* ------------------------------------------------------------------ replays rail */
const vrail = $('[data-vrail]');
function railBtns() {
  const max = vrail.scrollWidth - vrail.clientWidth - 2;
  $('[data-rail-prev]').disabled = vrail.scrollLeft <= 2;
  $('[data-rail-next]').disabled = vrail.scrollLeft >= max;
}
const railStep = dir => {
  const it = $('.vrail__item', vrail), gap = parseFloat(getComputedStyle(vrail).columnGap) || 0;
  const per = it ? Math.max(1, Math.round((vrail.clientWidth - parseFloat(getComputedStyle(vrail).paddingLeft) * 2 + gap) / (it.offsetWidth + gap))) : 1;
  const step = it ? (it.offsetWidth + gap) * per : vrail.clientWidth;
  vrail.scrollBy({ left: dir * step, behavior: RM ? 'auto' : 'smooth' });
};
$('[data-rail-prev]').addEventListener('click', () => railStep(-1));
$('[data-rail-next]').addEventListener('click', () => railStep(1));
vrail.addEventListener('scroll', () => requestAnimationFrame(railBtns), { passive: true });

/* ------------------------------------------------------------------ Live Room */
const LR = $('#liveroom'), lrSheet = $('.lr__sheet', LR), lrPlayer = $('[data-lr-player]'), lrFrame = $('[data-lr-frame]');
const lrPoster = $('[data-lr-poster]'), lrExpand = $('[data-lr-expand]'), lrMclose = $('.lr__mclose', LR);
const lrFlaps = new Flaps(null);
const lr = { open: false, mini: false, mode: 'vod', vid: DATA.latest, tab: 'live' };
const VIDS = $$('.vcard').map(a => ({ id: a.dataset.video, show: a.dataset.show, title: $('.vcard__title', a).textContent, meta: $('.vcard__meta', a).textContent }));
$('[data-lr-list]').innerHTML = VIDS.map(v => `<li><button class="lr__vid" type="button" data-lr-vid="${v.id}"><img src="img/videos/${v.id}-480.webp" width="480" height="270" alt="" loading="lazy" decoding="async"><span><b>${esc(v.title)}</b><small>${esc(v.meta)}</small></span></button></li>`).join('');
const embed = () => lr.mode === 'live' ? DATA.liveEmbed : DATA.vodEmbed.replace('{id}', lr.vid);
function mountIframe() {
  if (!lr.open) return;
  let f = $('iframe', lrFrame); const src = embed();
  if (!f) {
    f = d.createElement('iframe');
    f.title = 'Woodward Sports Network player';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.src = src; lrFrame.append(f);
  } else if (f.src !== src) f.src = src;
}
function renderLR() {
  const n = st; if (!n) return;
  const s = SHOWS[n.i], live = n.state === 'live';
  LR.classList.toggle('is-live', live);
  const kick = $('[data-lr-kick]'), name = $('[data-lr-name]'), hosts = $('[data-lr-hosts]');
  if (lr.mode === 'live') {
    kick.innerHTML = live ? `${DOT}LIVE NOW · ${esc(s.slotShort)}` : 'WSN LIVE STREAM';
    name.textContent = live ? s.name : 'Woodward Sports Network'; hosts.textContent = live ? hostsOf(s) : 'Live shows every weekday · 8AM–7PM ET';
  } else {
    const v = VIDS.find(x => x.id === lr.vid) || VIDS[0];
    const vs = SHOWS.find(x => x.id === v.show);
    kick.textContent = 'REPLAY · ' + v.meta.split('·').pop().trim().toUpperCase();
    name.textContent = vs ? vs.name : 'Woodward Sports'; hosts.textContent = v.title;
  }
  fitLR();
  const msg = $('[data-lr-msg]');
  const nxt = n.state === 'next' ? `Up next: <b>${esc(s.name)}</b> at ${firstHour(s)}. Starts in` : `We’re off air. Back <b>${esc(WD[n.wd] || '')} ${firstHour(s)}</b> with <b>${esc(s.name)}</b>.`;
  const html = live ? `<b>${esc(s.name)}</b> is live right now with ${esc(hostsOf(s))}.` : nxt;
  if (msg._html !== html + n.state) {
    msg._html = html + n.state;
    msg.innerHTML = html + (live ? '' : '<span class="flaps" aria-hidden="true"></span>');
    lrFlaps.el = $('.flaps', msg); lrFlaps.v = ''; lrFlaps.cells = [];
  }
  if (!live) lrFlaps.set(cd(n.left), lr.open && !lr.mini);
  const listen = $('[data-lr-listen]'); listen.href = s.apple;
  $$('.lr__vid', LR).forEach(b => b.classList.toggle('is-playing', lr.mode === 'vod' && b.dataset.lrVid === lr.vid));
}
subs.push(() => { if (lr.open) renderLR(); });
function setTab(t, focus) {
  lr.tab = t;
  $$('[data-lr-tab]', LR).forEach(b => { const on = b.dataset.lrTab === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  $('#lr-p-live').hidden = t !== 'live'; $('#lr-p-rep').hidden = t !== 'replays';
}
function setPoster() {
  const id = lr.mode === 'live' ? (st && st.state === 'live' ? SHOWS[st.i].replay : DATA.latest) : lr.vid;
  lrPoster.src = `img/videos/${id}-960.webp`;
}
function loadVideo(id) { lr.mode = 'vod'; lr.vid = id; setPoster(); renderLR(); mountIframe(); }
function loadLive() { lr.mode = 'live'; setPoster(); renderLR(); mountIframe(); }
function openLive({ from = 'btn', video = null, opener = null } = {}) {
  const live = st && st.state === 'live';
  if (lr.open && lr.mini) expand();
  if (video) { lr.mode = 'vod'; lr.vid = video; } else if (live) lr.mode = 'live'; else { lr.mode = 'vod'; lr.vid = DATA.latest; }
  setTab(lr.mode === 'live' ? 'live' : 'replays');
  setPoster(); renderLR();
  if (lr.open) { mountIframe(); return; }
  lr.open = true; LR._opener = opener || d.activeElement;
  LR.hidden = false; stack.push(LR); lock(true);
  LR.classList.add('is-open');
  const fade = [$('.lr__bg', LR), $('.lr__handle', LR), $('.lr__info', LR)];
  let a;
  if (RM) a = play(lrSheet, [{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
  else if (from === 'facade' && facade.getClientRects().length && facade._vis !== false) {
    const L = lrPlayer.getBoundingClientRect(), F = facade.getBoundingClientRect();
    a = play(lrPlayer, [{ transform: `translate(${F.left - L.left}px,${F.top - L.top}px) scale(${F.width / L.width})` }, { transform: 'none' }], { duration: 480, easing: EO });
    fade.forEach(el => play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 160, easing: 'ease-out', fill: 'backwards' }));
  } else if (mqTab.matches) a = play(lrSheet, [{ opacity: 0, transform: 'translateY(24px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EO });
  else a = play(lrSheet, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 420, easing: EO });
  (a ? a.finished : Promise.resolve()).catch(() => {}).then(mountIframe);
  setTimeout(() => $('[data-lr-min]', LR).focus({ preventScroll: true, focusVisible: kbdNav }), 60);
}
function resetLR() {
  lr.open = false; lr.mini = false;
  $('iframe', lrFrame)?.remove();
  LR.classList.remove('is-open', 'is-mini'); LR.setAttribute('aria-modal', 'true');
  lrPlayer.style.transform = ''; lrSheet.style.transform = ''; $('.lr__backdrop', LR).style.opacity = '';
  lrExpand.hidden = true; lrMclose.hidden = true; LR.hidden = true; miniClear(null);
}
function closeLive(returnFocus = true) {
  if (!lr.open) return;
  const wasMini = lr.mini;
  $('iframe', lrFrame)?.remove();
  const i = stack.indexOf(LR); if (i > -1) stack.splice(i, 1);
  if (!stack.length) lock(false);
  let a;
  if (wasMini) a = play(lrPlayer, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' });
  else if (RM) a = play(lrSheet, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' });
  else if (mqTab.matches) a = play(lrSheet, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px) scale(.98)' }], { duration: 240, easing: EC, fill: 'forwards' });
  else a = play(lrSheet, [{ transform: lrSheet.style.transform || 'none' }, { transform: 'translateY(100%)' }], { duration: 320, easing: EC, fill: 'forwards' });
  LR.classList.remove('is-open');
  (a ? a.finished : Promise.resolve()).catch(() => {}).then(() => { a?.cancel(); lrPlayer.getAnimations?.().forEach(x => x.cancel()); resetLR(); });
  if (returnFocus && !wasMini && LR._opener?.isConnected) LR._opener.focus({ preventScroll: true });
}
function miniRect(L) {
  const W = mqWide.matches ? 400 : Math.round(L.width * .42), s = W / L.width, h = L.height * s;
  const dock = $('.dock'), dh = dock && getComputedStyle(dock).display !== 'none' ? dock.getBoundingClientRect().height : 0;
  const right = innerWidth - (mqWide.matches ? 24 : 12), bottom = innerHeight - dh - (mqWide.matches ? 24 : 30);
  return { s, x: right - W, y: bottom - h, W, h };
}
/* page-end clearance so the mini player never sits on the footer links */
function miniClear(m) { if (m) H.style.setProperty('--mini-clear', Math.ceil(innerHeight - m.y) + 'px'); H.classList.toggle('lr-mini', !!m); }
function placeMclose(m) { lrMclose.style.transform = `translate(${Math.round(Math.min(m.x + m.W - 30, innerWidth - 50))}px,${Math.round(m.y - 20)}px)`; }
function minimize(fromRect) {
  if (!lr.open || lr.mini) return;
  lr.mini = true;
  const P = fromRect || lrPlayer.getBoundingClientRect();
  lrSheet.getAnimations?.().forEach(a => a.cancel()); lrSheet.style.transform = '';
  lrPlayer.getAnimations?.().forEach(a => a.cancel()); lrPlayer.style.transform = 'none';
  const L = lrPlayer.getBoundingClientRect(), m = miniRect(L);
  const to = `translate(${m.x - L.left}px,${m.y - L.top}px) scale(${m.s})`;
  lrPlayer.style.transform = to;
  play(lrPlayer, [{ transform: `translate(${P.left - L.left}px,${P.top - L.top}px) scale(${P.width / L.width})` }, { transform: to }], { duration: RM ? 1 : 420, easing: EO });
  LR.classList.add('is-mini'); LR.setAttribute('aria-modal', 'false');
  $('.lr__backdrop', LR).style.opacity = '';
  const i = stack.indexOf(LR); if (i > -1) stack.splice(i, 1);
  if (!stack.length) lock(false);
  lrExpand.hidden = false; lrMclose.hidden = false; placeMclose(m); miniClear(m);
  lrExpand.focus({ preventScroll: true });
}
function expand() {
  if (!lr.mini) return;
  lr.mini = false;
  const from = lrPlayer.style.transform;
  lrPlayer.style.transform = '';
  play(lrPlayer, [{ transform: from }, { transform: 'none' }], { duration: RM ? 1 : 420, easing: EO });
  LR.classList.remove('is-mini'); LR.setAttribute('aria-modal', 'true'); miniClear(null);
  if (!stack.includes(LR)) stack.push(LR); lock(true);
  lrExpand.hidden = true; lrMclose.hidden = true;
  setTimeout(() => $('[data-lr-min]', LR).focus({ preventScroll: true, focusVisible: kbdNav }), 60);
}
lrExpand.addEventListener('click', expand);
$('[data-lr-min]', LR).addEventListener('click', () => minimize());
$$('[data-lr-close]', LR).forEach(b => b.addEventListener('click', () => closeLive()));
addEventListener('resize', () => { if (lr.mini) { lrPlayer.style.transform = 'none'; const L = lrPlayer.getBoundingClientRect(), m = miniRect(L); lrPlayer.style.transform = `translate(${m.x - L.left}px,${m.y - L.top}px) scale(${m.s})`; placeMclose(m); miniClear(m); } });
$$('[data-lr-tab]', LR).forEach(b => b.addEventListener('click', () => { setTab(b.dataset.lrTab); if (b.dataset.lrTab === 'live') loadLive(); }));
$('.tabs', LR).addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const t = lr.tab === 'live' ? 'replays' : 'live'; setTab(t, true); if (t === 'live') loadLive(); } });
$('[data-lr-latest]', LR).addEventListener('click', () => { const v = st && st.state === 'live' ? SHOWS[st.i].replay : DATA.latest; setTab('replays'); loadVideo(v); });
$('[data-lr-list]').addEventListener('click', e => { const b = e.target.closest('[data-lr-vid]'); if (b) { loadVideo(b.dataset.lrVid); $('.lr__info', LR).scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); } });
/* drag to minimize: handle strip + now-playing plate only, never the iframe */
(() => {
  let g = null;
  const bd = $('.lr__backdrop', LR);
  $$('[data-lr-drag]', LR).forEach(zone => {
    zone.addEventListener('pointerdown', e => {
      if (lr.mini || (e.pointerType === 'mouse' && e.button) || e.target.closest('button, a')) return;
      g = { y0: e.clientY, last: e.clientY, t: e.timeStamp, v: 0, dy: 0 };
      try { zone.setPointerCapture(e.pointerId); } catch (x) { /* noop */ }
    });
    zone.addEventListener('pointermove', e => {
      if (!g) return;
      let dy = e.clientY - g.y0; if (dy < 0) dy *= .3;
      const dt = Math.max(1, e.timeStamp - g.t); g.v = (e.clientY - g.last) / dt; g.last = e.clientY; g.t = e.timeStamp; g.dy = dy;
      lrSheet.style.transform = `translateY(${dy}px)`;
      bd.style.opacity = String(Math.max(0, .96 * (1 - Math.max(0, dy) / innerHeight)));
    });
    const end = () => {
      if (!g) return; const { dy, v } = g; g = null;
      if (dy > innerHeight * .25 || (v > .5 && dy > 24)) { const P = lrPlayer.getBoundingClientRect(); minimize(P); }
      else {
        const from = lrSheet.style.transform; lrSheet.style.transform = ''; bd.style.opacity = '';
        if (from) play(lrSheet, [{ transform: from }, { transform: 'none' }], { duration: 300, easing: SPRING });
      }
    };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  });
})();
$$('[data-live-open]').forEach(a => a.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  const from = a.dataset.liveOpen || 'btn';
  const video = from === 'facade' && !(st && st.state === 'live') ? a.dataset.video : null;
  openLive({ from, video, opener: a });
}));
$$('.vcard').forEach(a => a.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault(); openLive({ video: a.dataset.video, opener: a });
}));
pill.addEventListener('click', e => { if (st && st.state === 'live') { e.preventDefault(); openLive({ opener: pill }); } });

/* ------------------------------------------------------------------ Find */
const FD = $('#find'), fInput = $('#find-input'), fRes = $('[data-find-results]');
let fIndex = null, fOpts = [], fActive = -1;
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'");
const GROUPS = [['show', 'SHOWS'], ['team', 'TEAMS'], ['story', 'STORIES'], ['video', 'VIDEOS']];
function buildIndex() {
  fIndex = $$('[data-find-type]').map(el => ({ el, type: el.dataset.findType, title: el.dataset.findTitle, hay: norm(el.dataset.findTitle + ' ' + (el.dataset.findKeys || '')), t: norm(el.dataset.findTitle) }));
  const teamChips = $$('.tile').map(t => `<button class="fx" type="button" data-fx-team="${t.dataset.team}" style="--team:${t.style.getPropertyValue('--team')}"><i></i>${esc($('.tile__name', t).textContent)}</button>`).join('');
  $('[data-find-teams]').innerHTML = teamChips;
  $('[data-find-shows]').innerHTML = SHOWS.map((s, i) => `<button class="fx" type="button" data-fx-show="${i}">${esc(s.short)}</button>`).join('');
}
function hl(title, toks) {
  let out = esc(title);
  toks.filter(t => t.length > 1).sort((a, b) => b.length - a.length).forEach(t => {
    const re = new RegExp('(' + esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    out = out.replace(/(<[^>]*>)|([^<]+)/g, (m, tag, txt) => tag || txt.replace(re, '<mark>$1</mark>'));
  });
  return out;
}
function search(q) {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  fOpts = []; fActive = -1;
  if (!toks.length) { fRes.innerHTML = ''; $('[data-find-empty]').hidden = false; $('[data-find-none]').hidden = true; fInput.setAttribute('aria-expanded', 'false'); fInput.removeAttribute('aria-activedescendant'); return; }
  $('[data-find-empty]').hidden = true;
  let html = '';
  for (const [type, label] of GROUPS) {
    const hits = fIndex.filter(x => x.type === type && toks.every(t => x.hay.includes(t)))
      .map(x => ({ x, sc: (x.t.startsWith(toks[0]) ? 3 : 0) + (toks.every(t => x.t.includes(t)) ? 2 : 0) }))
      .sort((a, b) => b.sc - a.sc).slice(0, 5);
    if (!hits.length) continue;
    html += `<div class="fgroup" role="group" aria-label="${label.toLowerCase()}"><p class="fgroup__h" aria-hidden="true">${label}</p>`;
    hits.forEach(({ x }) => {
      const k = fOpts.push(x) - 1;
      const verb = { show: 'Open', team: 'Filter', story: 'Read', video: 'Play' }[type];
      html += `<div class="fres" role="option" id="fo-${k}" data-k="${k}" aria-selected="false"><span class="fres__t">${hl(x.title, toks)}</span><span class="fres__k">${verb}</span></div>`;
    });
    html += '</div>';
  }
  fRes.innerHTML = html;
  $('[data-find-none]').hidden = fOpts.length > 0;
  fInput.setAttribute('aria-expanded', String(fOpts.length > 0));
  if (fOpts.length) setActive(0);
}
function setActive(k) {
  fActive = k;
  $$('.fres', fRes).forEach(o => o.setAttribute('aria-selected', String(+o.dataset.k === k)));
  const o = $(`#fo-${k}`); if (o) { fInput.setAttribute('aria-activedescendant', o.id); o.scrollIntoView({ block: 'nearest' }); }
}
function act(x) {
  if (!x) return;
  const el = x.el;
  if (x.type === 'story') { window.open(el.href, '_blank', 'noopener'); closeDialog(FD); return; }
  closeDialog(FD, false);
  if (x.type === 'team') setFilter(el.dataset.team, { scroll: true });
  else if (x.type === 'show') openSheet(SHOWS.findIndex(s => s.id === el.dataset.sheet), $('[data-find-open]'));
  else if (x.type === 'video') openLive({ video: el.dataset.video, opener: $('[data-find-open]') });
}
function openFind(opener) {
  if (!fIndex) buildIndex();
  fInput.value = ''; search('');
  openDialog(FD, opener, fInput);
}
fInput.addEventListener('input', () => search(fInput.value));
fInput.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); if (fOpts.length) setActive((fActive + 1) % fOpts.length); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (fOpts.length) setActive((fActive - 1 + fOpts.length) % fOpts.length); }
  else if (e.key === 'Enter') { e.preventDefault(); act(fOpts[fActive]); }
});
fRes.addEventListener('click', e => { const o = e.target.closest('.fres'); if (o) act(fOpts[+o.dataset.k]); });
FD.addEventListener('click', e => {
  const t = e.target.closest('[data-fx-team]'), s = e.target.closest('[data-fx-show]');
  if (t) { closeDialog(FD, false); setFilter(t.dataset.fxTeam, { scroll: true }); }
  if (s) { closeDialog(FD, false); openSheet(+s.dataset.fxShow, $('[data-find-open]')); }
});
$('[data-find-open]').addEventListener('click', e => openFind(e.currentTarget));
addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(d.activeElement?.tagName) || d.activeElement?.isContentEditable;
  if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (FD.hidden) openFind($('[data-find-open]')); else closeDialog(FD); }
  else if (e.key === '/' && !typing && FD.hidden && !stack.length) { e.preventDefault(); openFind($('[data-find-open]')); }
});

/* ------------------------------------------------------------------ misc */
(() => { // App Store first on iOS, YouTube Live first elsewhere
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const b = $('[data-appbtns]'), yt = b && $('.app__yt', b);
  if (yt && !ios) b.prepend(yt); // reorder the DOM, not CSS order, so focus follows the visual order
})();
function relayout() {
  tickerSpeed();
  fitPill();   chipPeek(); moveInd($('.fchip.is-on'), false); chipFade();
  fitL3(); if (lr.open) fitLR();
  markNav(); railBtns();
  if (st) renderRail(st, Date.now(), true);
}
let rzT = 0;
addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(relayout, 120); }, { passive: true });
[mqTab, mqWide].forEach(m => m.addEventListener?.('change', () => { if (!expanded) applyStories(false); }));

/* ------------------------------------------------------------------ boot */
clock.start();
localTimes();
applyStories(false);
initReveals();
tapes.make();
relayout();
d.fonts?.ready.then(relayout);
ident();
