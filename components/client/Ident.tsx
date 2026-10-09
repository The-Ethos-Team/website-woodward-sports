'use client';
/* Network ident, once per session: shutters, mint line, the street-sign logo swings in and flies to the header. */
import { useEffect, useRef, useState } from 'react';
import { EC, EO, motion, play } from '@/lib/ui/motion';
import { startHero } from './Boot';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export function Ident() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const H = document.documentElement;
    const el = root.current;
    if (!H.classList.contains('intro') || !el || motion.rm) {
      H.classList.remove('intro');
      startHero();
      setDone(true);
      return;
    }
    el.style.animation = 'none';
    try { sessionStorage.setItem('wsn-ident', '1'); } catch { /* private mode */ }
    let finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const anims: Animation[] = [];
    const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const add = (a: Animation | null) => { if (a) anims.push(a); };
    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      anims.forEach(a => { try { a.finish(); } catch { /* noop */ } });
      removeEventListener('pointerdown', finish, true);
      removeEventListener('keydown', finish, true);
      H.classList.remove('intro');
      startHero();
      const out = play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      (out ? out.finished : Promise.resolve()).then(() => setDone(true), () => setDone(true));
    };
    addEventListener('pointerdown', finish, true);
    addEventListener('keydown', finish, true);
    (async () => {
      let svg = '';
      try { svg = await Promise.race([fetch('/img/logo.svg').then(r => (r.ok ? r.text() : '')), wait(900).then(() => '')]); } catch { svg = ''; }
      await Promise.race([document.fonts?.ready, wait(500)]);
      if (finished) return;
      const lg = logo.current;
      if (!svg || !lg) { finish(); return; }
      lg.innerHTML = svg;
      const s = lg.querySelector('svg');
      s?.removeAttribute('role');
      s?.setAttribute('aria-hidden', 'true');
      add(play(el.querySelector('.ident__line'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 260, easing: EC, fill: 'forwards' }));
      add(play(lg, [
        { transform: 'rotate(-14deg) translateY(-24px)', opacity: 0, easing: 'ease-out' },
        { transform: 'rotate(5deg)', opacity: 1, offset: 0.45, easing: 'ease-in-out' },
        { transform: 'rotate(-2.5deg)', offset: 0.7, easing: 'ease-in-out' },
        { transform: 'rotate(1deg)', offset: 0.85, easing: 'ease-in-out' },
        { transform: 'rotate(0deg)', opacity: 1 },
      ], { duration: 700, delay: 120, fill: 'both' }));
      const sb = lg.querySelector('#sign-bottom'), net = lg.querySelector('#network');
      add(play(sb, [{ transform: 'rotate(-7deg)' }, { transform: 'rotate(3deg)', offset: 0.5 }, { transform: 'rotate(-1deg)', offset: 0.8 }, { transform: 'rotate(0deg)' }], { duration: 760, delay: 200, easing: 'ease-out', fill: 'both' }));
      add(play(net, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 520, easing: EO, fill: 'both' }));
      later(880, () => {
        add(play(el.querySelector('.ident__p--l'), [{ transform: 'none' }, { transform: 'translateX(-100%)' }], { duration: 420, easing: EC, fill: 'forwards' }));
        add(play(el.querySelector('.ident__p--r'), [{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 420, easing: EC, fill: 'forwards' }));
        add(play(el.querySelector('.ident__line'), [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
        const tgt = document.querySelector('.hdr__logo img')?.getBoundingClientRect(), f = lg.getBoundingClientRect();
        if (tgt) {
          const dx = tgt.left + tgt.width / 2 - (f.left + f.width / 2), dy = tgt.top - f.top, sc = tgt.width / f.width;
          add(play(lg, [{ transform: 'none' }, { transform: `translate(${dx}px,${dy}px) scale(${sc})` }], { duration: 520, easing: EO, fill: 'forwards' }));
        }
      });
      later(900, () => startHero(true));
      later(1420, finish);
    })();
    return () => { timers.forEach(clearTimeout); removeEventListener('pointerdown', finish, true); removeEventListener('keydown', finish, true); };
  }, []);

  if (done) return null;
  return (
    <div className="ident" aria-hidden="true" ref={root}>
      <span className="ident__p ident__p--l" />
      <span className="ident__p ident__p--r" />
      <span className="ident__line" />
      <span className="ident__logo" ref={logo} />
    </div>
  );
}
