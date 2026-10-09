'use client';
/* App-wide behaviour that used to live at the top of js/main.js: reduced motion, input modality, page
   visibility, reveals, off-screen pausing, blade geometry, the section in view, the hero entrance,
   the live <html> classes and the screen-reader announcer. Re-runs its DOM scans after every navigation. */
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { ScheduleContext, setSchedule, useLive } from '@/lib/live/store';
import { keyOf, stateLine } from '@/lib/live/compute';
import { installDialogKeys } from '@/lib/ui/dialogs';
import { isFS, motion } from '@/lib/ui/motion';
import { setSection } from '@/lib/ui/section';
import type { Schedule } from '@/lib/types';

if (typeof window !== 'undefined') (window as Window & { __wsn?: number }).__wsn = 1;

/** Hero entrance (after the ident, or straight away). Types the facade clock in. */
export function startHero(force = false) {
  const H = document.documentElement;
  if (!force && H.classList.contains('intro')) return;
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!hero || hero.dataset.started) return;
  hero.dataset.started = '1';
  if (motion.rm || isFS()) return;
  hero.classList.add('is-in');
  setTimeout(() => dispatchEvent(new Event('wsn:hero')), 300);
}

export function LiveProvider({ schedule, children }: { schedule: Schedule; children: ReactNode }) {
  setSchedule(schedule);
  return <ScheduleContext.Provider value={schedule}>{children}</ScheduleContext.Provider>;
}

export function Boot() {
  const path = usePathname();

  /* once */
  useEffect(() => {
    const H = document.documentElement;
    installDialogKeys();
    const mqRM = matchMedia('(prefers-reduced-motion: reduce)');
    const onRM = () => {
      motion.rm = mqRM.matches;
      H.classList.toggle('rm', motion.rm);
      H.classList.toggle('a', !motion.rm && H.classList.contains('v'));
    };
    onRM();
    mqRM.addEventListener('change', onRM);
    if (H.classList.contains('fs')) H.classList.remove('intro');
    const kd = (e: KeyboardEvent) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) motion.kbdNav = true; };
    const pd = () => { motion.kbdNav = false; };
    const fi = (e: FocusEvent) => { if ((e.target as Element).matches?.('input, textarea')) H.classList.add('kb'); };
    const fo = (e: FocusEvent) => { if ((e.target as Element).matches?.('input, textarea')) H.classList.remove('kb'); };
    const vis = () => H.classList.toggle('is-hidden', document.hidden);
    addEventListener('keydown', kd, true);
    addEventListener('pointerdown', pd, true);
    addEventListener('focusin', fi);
    addEventListener('focusout', fo);
    document.addEventListener('visibilitychange', vis);
    return () => {
      mqRM.removeEventListener('change', onRM);
      removeEventListener('keydown', kd, true);
      removeEventListener('pointerdown', pd, true);
      removeEventListener('focusin', fi);
      removeEventListener('focusout', fo);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);

  /* per page */
  useEffect(() => {
    const $$ = (s: string) => Array.from(document.querySelectorAll<HTMLElement>(s));
    const cleanups: (() => void)[] = [];

    /* reveals */
    if (isFS()) $$('[data-reveal-head], [data-reveal]').forEach(el => el.classList.add('is-in', 'rv-done'));
    else {
      const headIO = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        headIO.unobserve(e.target);
      }), { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });
      const grpIO = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        const t = e.target;
        t.classList.add('is-in');
        grpIO.unobserve(t);
        setTimeout(() => t.classList.add('rv-done'), 1400);
      }), { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
      $$('[data-reveal-head]:not(.is-in)').forEach(el => headIO.observe(el));
      $$('[data-reveal]:not(.is-in)').forEach(el => grpIO.observe(el));
      cleanups.push(() => { headIO.disconnect(); grpIO.disconnect(); });
    }

    /* continuous animations pause off-screen */
    const visIO = new IntersectionObserver(es => es.forEach(e => {
      (e.target as HTMLElement & { _vis?: boolean })._vis = e.isIntersecting;
      e.target.classList.toggle('is-off', !e.isIntersecting);
    }), { rootMargin: '80px 0px' });
    $$('.hero, .pods, [data-demo], .app__stage').forEach(el => visIO.observe(el));
    cleanups.push(() => visIO.disconnect());

    /* blades: keep the −20° edge exact for content-sized plates */
    const ro = new ResizeObserver(es => {
      const todo = es.map(e => [e.target as HTMLElement & { _h?: number }, Math.round(e.borderBoxSize?.[0]?.blockSize ?? (e.target as HTMLElement).offsetHeight)] as const);
      requestAnimationFrame(() => todo.forEach(([el, h]) => { if (h && Math.abs((el._h || 0) - h) >= 1) { el._h = h; el.style.setProperty('--h', h + 'px'); } }));
    });
    $$('.sh__blade, .l3__plate, .lr__l3, .phero__blade').forEach(el => ro.observe(el));
    cleanups.push(() => ro.disconnect());

    /* home: which section is in view (header marker, dock bar) */
    setSection('');
    if (path === '/') {
      const secIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setSection(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
      $$('main > section[id], .top > section[id]').forEach(s => secIO.observe(s));
      cleanups.push(() => secIO.disconnect());
    }

    startHero();
    return () => cleanups.forEach(f => f());
  }, [path]);

  return null;
}

/** <html> live classes (dock disc ring, pill pulse) and the polite announcement when the show changes. */
export function LiveHtml({ shows }: { shows: Schedule['shows'] }) {
  const n = useLive();
  const el = useRef<HTMLDivElement>(null);
  const last = useRef('');
  useEffect(() => {
    if (!n) return;
    const H = document.documentElement;
    H.classList.toggle('is-live', n.state === 'live');
    H.classList.toggle('is-next', n.state === 'next');
    H.classList.toggle('is-off', n.state === 'off');
    const k = keyOf(n);
    if (last.current && k !== last.current && el.current) {
      const box = el.current, msg = stateLine(n, shows);
      box.textContent = '';
      setTimeout(() => { box.textContent = msg; }, 60);
    }
    last.current = k;
  }, [n, shows]);
  return <div className="sr-only" aria-live="polite" ref={el} />;
}
