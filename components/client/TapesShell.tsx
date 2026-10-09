'use client';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/bits';
import { motion, play } from '@/lib/ui/motion';

/** Crossed tapes: 40 s loops whose playbackRate follows scroll velocity; pause button; off-screen pause. */
export function TapesShell({ text, to }: { text: string; to?: 'paper' | 'ink' }) {
  const root = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState(false);
  const st = useRef({ anims: [] as Animation[], user: false, vis: true });

  useEffect(() => {
    const el = root.current;
    if (!el || motion.rm) return;
    const s = st.current;
    s.anims = Array.from(el.querySelectorAll('.tape__track')).map((t, k) =>
      play(t, k ? [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }] : [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 40000, iterations: Infinity }),
    ).filter(Boolean) as Animation[];
    let rate = 1, vel = 0, lastY = scrollY, lastT = performance.now(), raf = 0;
    const loop = () => {
      raf = 0;
      vel *= 1 - 0.08;
      const target = (vel >= 0 ? 1 : -1) * (1 + Math.min(Math.abs(vel) / 1.5, 3));
      rate += (target - rate) * 0.08;
      s.anims.forEach(a => { a.playbackRate = rate; });
      if (Math.abs(rate - 1) > 0.005 || Math.abs(vel) > 0.01) raf = requestAnimationFrame(loop);
      else { rate = 1; s.anims.forEach(a => { a.playbackRate = 1; }); }
    };
    const onScroll = () => {
      const t = performance.now(), y = scrollY, dt = Math.max(1, t - lastT);
      const v = (y - lastY) / dt;
      lastY = y; lastT = t;
      if (!s.anims.length || s.user || !s.vis) return;
      vel = Math.abs(v) > Math.abs(vel) ? v : vel;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(es => es.forEach(e => {
      s.vis = e.isIntersecting;
      if (!s.user) s.anims.forEach(a => (e.isIntersecting ? a.play() : a.pause()));
    }), { rootMargin: '80px 0px' });
    io.observe(el);
    const onVis = () => { if (document.hidden) s.anims.forEach(a => a.pause()); else if (!s.user && s.vis) s.anims.forEach(a => a.play()); };
    document.addEventListener('visibilitychange', onVis);
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      cancelAnimationFrame(raf);
      s.anims.forEach(a => a.cancel());
      s.anims = [];
    };
  }, []);

  const toggle = () => {
    const u = !user;
    setUser(u);
    st.current.user = u;
    st.current.anims.forEach(a => (u ? a.pause() : a.play()));
  };

  return (
    <div className={'tapes' + (to === 'ink' ? ' tapes--ink' : '')} ref={root}>
      <div className="tape tape--a" aria-hidden="true"><div className="tape__track"><span>{text}</span><span>{text}</span></div></div>
      <div className="tape tape--b" aria-hidden="true"><div className="tape__track"><span>{text}</span><span>{text}</span></div></div>
      <button className="tapes__pause" type="button" aria-pressed={user} onClick={toggle}>
        <span className="sr-only">{user ? 'Play moving tapes' : 'Pause moving tapes'}</span>
        <Icon name="pause" cls="ico ico--pause" />
        <Icon name="play" cls="ico ico--play" />
      </button>
    </div>
  );
}
