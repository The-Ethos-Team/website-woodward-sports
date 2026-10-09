'use client';
import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { TEAM, TEAM_IDS } from '@/lib/config';
import { register } from '@/lib/ui/bus';
import { EC, EO, motion, play, SPRING, vibrate, mq, MQ } from '@/lib/ui/motion';
import { Arrow } from '@/components/ui/bits';
import { StoryItem, kindAt, type StoryView } from '@/components/ui/StoryItem';

const limitNow = () => (mq(MQ.wide) ? 8 : mq(MQ.tab) ? 7 : 6);

/** Home stories: team filter chips with a sliding indicator, FLIP morph between filters, "More stories". */
export function StoriesFilter({ items, cats }: { items: StoryView[]; cats: Record<string, string> }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(8);
  const match = useCallback((f: string) => items.filter(s => f === 'all' || s.teams.includes(f as never)), [items]);
  const [shown, setShown] = useState<number[]>(() => items.slice(0, 8).map(s => s.id));
  const lis = useRef(new Map<number, HTMLLIElement>());
  const list = useRef<HTMLOListElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const ind = useRef<HTMLSpanElement & { _x?: number; _w?: number }>(null);
  const busy = useRef(false);

  const all = match(filter);
  const shownSet = new Set(shown);
  const pos = new Map(shown.map((id, k) => [id, k]));

  /* chip indicator */
  const moveInd = useCallback((btn: HTMLElement | null, animate: boolean) => {
    const el = ind.current, strip = chips.current;
    if (!btn || !el || !strip) return;
    const x = btn.offsetLeft, w = btn.offsetWidth, px = el._x ?? x, pw = el._w ?? w;
    el.style.width = w + 'px';
    el.style.transform = `translateX(${x}px)`;
    if (animate && !motion.rm && (px !== x || pw !== w)) play(el, [{ transform: `translateX(${px}px) scaleX(${pw / w})` }, { transform: `translateX(${x}px) scaleX(1)` }], { duration: 420, easing: SPRING });
    el._x = x; el._w = w;
    if (animate) strip.scrollTo({ left: Math.max(0, x - (strip.clientWidth - w) / 2), behavior: motion.rm ? 'auto' : 'smooth' });
  }, []);
  const chipFade = useCallback(() => {
    const s = chips.current;
    if (!s) return;
    const max = s.scrollWidth - s.clientWidth;
    s.classList.toggle('is-scrolled', s.scrollLeft > 2);
    s.classList.toggle('at-end', s.scrollLeft >= max - 2);
  }, []);
  /* scroll cue: when a chip ends right at the edge, widen the gaps so the next one peeks out of the fade */
  const chipPeek = useCallback(() => {
    const s = chips.current;
    if (!s) return;
    s.style.removeProperty('--cg');
    const cs = Array.from(s.querySelectorAll<HTMLElement>('.fchip')), edge = s.clientWidth - 4;
    if (s.scrollWidth <= s.clientWidth + 1) return;
    const k = cs.findIndex(c => c.offsetLeft + c.offsetWidth > edge);
    if (k < 2 || cs[k].offsetLeft < edge - 36) return;
    const prev = cs[k - 1], shift = edge + 28 - (prev.offsetLeft + prev.offsetWidth);
    s.style.setProperty('--cg', (2 + shift / (k - 1)).toFixed(1) + 'px');
  }, []);

  /* apply a filter/expansion: fade out leavers, swap, FLIP the stayers, rise the newcomers */
  const apply = useCallback((f: string, exp: boolean, lim: number, animate: boolean) => {
    const next = match(f).slice(0, exp ? Infinity : lim).map(s => s.id);
    const el = list.current;
    const r = el?.getBoundingClientRect();
    if (!el || !r || !animate || motion.rm || r.bottom < 0 || r.top > innerHeight || busy.current) { setShown(next); return; }
    busy.current = true;
    const nextSet = new Set(next);
    const kindOf = (li: HTMLElement) => li.classList.contains('st--feature') ? 'f' : li.classList.contains('st--row') ? 'r' : 'c';
    const cur = shown.map(id => lis.current.get(id)!).filter(Boolean);
    const first = new Map(cur.map(li => [li, [li.getBoundingClientRect(), kindOf(li)] as const]));
    const leaving = cur.filter(li => !nextSet.has(Number(li.dataset.id)));
    Promise.all(leaving.map(li => play(li, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 160, easing: EC, fill: 'forwards' })?.finished))
      .catch(() => {})
      .then(() => {
        flushSync(() => setShown(next));
        leaving.forEach(li => li.getAnimations?.().forEach(a => a.cancel()));
        let k = 0;
        next.forEach(id => {
          const li = lis.current.get(id);
          if (!li) return;
          const f0 = first.get(li);
          if (f0 && f0[1] === kindOf(li)) {
            const l = li.getBoundingClientRect(), dx = f0[0].left - l.left, dy = f0[0].top - l.top;
            if (Math.abs(dx) + Math.abs(dy) > 1) play(li, [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 380, easing: EO });
          } else play(li, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 30 * k++, easing: EO, fill: 'backwards' });
        });
        busy.current = false;
      });
  }, [match, shown]);

  const choose = useCallback((team: string, o: { scroll?: boolean } = {}) => {
    if (team !== 'all' && !TEAM_IDS.includes(team as never)) team = 'all';
    const changed = team !== filter;
    setFilter(team);
    moveInd(chips.current?.querySelector<HTMLElement>(`.fchip[data-filter="${team}"]`) ?? null, true);
    if (changed) { vibrate(8); apply(team, expanded, limit, true); }
    if (o.scroll) document.getElementById('stories')?.scrollIntoView({ behavior: motion.rm ? 'auto' : 'smooth', block: 'start' });
    return true;
  }, [filter, expanded, limit, apply, moveInd]);

  useEffect(() => register('setStoryFilter', choose), [choose]);

  /* breakpoints: 6 / 7 / 8 stories before "More" */
  useEffect(() => {
    const on = () => { const l = limitNow(); setLimit(l); if (!expanded) setShown(match(filter).slice(0, l).map(s => s.id)); };
    on();
    const qs = [matchMedia(MQ.tab), matchMedia(MQ.wide)];
    qs.forEach(q => q.addEventListener('change', on));
    return () => qs.forEach(q => q.removeEventListener('change', on));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  useLayoutEffect(() => {
    const relayout = () => { chipPeek(); moveInd(chips.current?.querySelector<HTMLElement>('.fchip.is-on') ?? null, false); chipFade(); };
    relayout();
    document.fonts?.ready.then(relayout);
    let t: ReturnType<typeof setTimeout>;
    const on = () => { clearTimeout(t); t = setTimeout(relayout, 120); };
    addEventListener('resize', on, { passive: true });
    return () => { removeEventListener('resize', on); clearTimeout(t); };
  }, [chipPeek, chipFade, moveInd]);

  const btnLabel = TEAM[filter as keyof typeof TEAM]?.short ?? '';
  return (
    <>
      <div className="fbar">
        <div className="wrap fbar__in">
          <span className="fbar__count" aria-live="polite">{all.length} {all.length === 1 ? 'story' : 'stories'}</span>
          <div className="fchips" role="group" aria-label="Filter stories by team" ref={chips} onScroll={() => requestAnimationFrame(chipFade)}>
            <button className={'fchip' + (filter === 'all' ? ' is-on' : '')} type="button" aria-pressed={filter === 'all'} data-filter="all" onClick={() => choose('all')}>All</button>
            {TEAM_IDS.map(t => (
              <button key={t} className={'fchip' + (filter === t ? ' is-on' : '')} type="button" aria-pressed={filter === t} data-filter={t} style={{ ['--team' as string]: TEAM[t].color }} onClick={() => choose(t)}>
                <i className="fchip__dot" />{TEAM[t].short}
              </button>
            ))}
            <span className="fchips__ind" aria-hidden="true" ref={ind} />
          </div>
        </div>
      </div>
      <div className="wrap">
        <ol className="stories" id="stories-list" data-reveal="" ref={list}>
          {items.map(s => (
            <StoryItem key={s.id} s={s} kind={kindAt(pos.get(s.id) ?? 9)} hidden={!shownSet.has(s.id)}
              liRef={el => { if (el) lis.current.set(s.id, el); else lis.current.delete(s.id); }} />
          ))}
        </ol>
        <p className="stories__empty" hidden={all.length > 0}>
          No fresh {btnLabel} stories here.{' '}
          <a href={cats[filter] ?? 'https://woodwardsports.com/news/'} target="_blank" rel="noopener">See all coverage on woodwardsports.com<Arrow /><span className="sr-only"> (opens in new tab)</span></a>
        </p>
        <div className="stories__foot">
          <button className="btn btn--ink" type="button" aria-controls="stories-list" aria-expanded={expanded} hidden={all.length <= shown.length}
            onClick={() => { setExpanded(true); apply(filter, true, limit, true); }}>More stories</button>
          <Link className="textlink" href="/stories">All stories<Arrow /></Link>
        </div>
      </div>
    </>
  );
}
