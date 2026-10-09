/* Motion helpers (client only). Transform/opacity WAAPI, reduced-motion aware. Ported from js/main.js. */

export const EO = 'cubic-bezier(.16,1,.3,1)';
export const EC = 'cubic-bezier(.7,0,.2,1)';
export const SPRING =
  typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)')
    ? 'linear(0,.033,.12 4.4%,.253,.414 9.6%,.746 15.5%,.879,.982 22.1%,1.024 25%,1.048 28.1%,1.056 31.3%,1.054 34.8%,1.029 42.7%,1.009 50.4%,.998 60%,1)'
    : 'cubic-bezier(.34,1.56,.64,1)';

/** reduced motion (kept live by Boot) */
export const motion = {
  rm: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  kbdNav: false,
};
export const isRM = () => motion.rm;
export const isFS = () => typeof document !== 'undefined' && document.documentElement.classList.contains('fs');

export function play(el: Element | null | undefined, kf: Keyframe[], o: KeyframeAnimationOptions): Animation | null {
  if (!el) return null;
  try {
    return el.animate(kf, o);
  } catch {
    return null;
  }
}

export function vibrate(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* no haptics */
  }
}

const visible = (el: Element) => (el as HTMLElement & { _vis?: boolean })._vis !== false && el.getClientRects().length > 0;

/** channel surf: out −6% → scanline → noise → spring in → OSD */
export function surf(box: HTMLElement | null, update: () => void, osdText?: string) {
  if (!box || motion.rm || !visible(box)) {
    update();
    return;
  }
  const targets = Array.from(box.querySelectorAll('[data-surf-content]'));
  if (!targets.length) targets.push(box);
  const outs = targets.map(t => play(t, [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-6%)', opacity: 0 }], { duration: 120, easing: EC, fill: 'forwards' }));
  Promise.all(outs.map(a => a?.finished)).catch(() => {}).then(() => {
    update();
    play(box.querySelector('.surf__scan'), [{ transform: 'translateY(-100%)', opacity: 1 }, { transform: 'translateY(340%)', opacity: 1 }], { duration: 260, easing: 'linear' });
    play(box.querySelector('.surf__noise'), [{ opacity: 0, transform: 'translate(0,0)' }, { opacity: 0.3, transform: 'translate(-30px,18px)', offset: 0.5 }, { opacity: 0, transform: 'translate(18px,-30px)' }], { duration: 180, easing: 'steps(4)' });
    targets.forEach((t, k) => {
      play(t, [{ transform: 'translateX(6%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: 40, easing: SPRING, fill: 'backwards' });
      outs[k]?.cancel();
    });
    const osd = box.querySelector<HTMLElement>('[data-osd]');
    if (osd && osdText) {
      osd.textContent = osdText;
      osd.getAnimations?.().forEach(a => a.cancel());
      play(osd, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.88 }, { opacity: 0 }], { duration: 1200 });
    }
  });
}

/** Split-flap digits. Owns the children of `el` (React renders it empty). */
type Cell = { el: HTMLElement; sep?: boolean; t?: HTMLElement; b?: HTMLElement; ft?: HTMLElement; fb?: HTMLElement };
export class FlapsImpl {
  el: HTMLElement | null;
  v = '';
  cells: Cell[] = [];
  constructor(el: HTMLElement | null) { this.el = el; }
  set(v: string, animate: boolean) {
    if (!this.el || v === this.v) return;
    const old = this.v;
    this.v = v;
    if (old.length !== v.length) return this.build(v);
    for (let i = 0; i < v.length; i++) {
      if (v[i] === old[i]) continue;
      const c = this.cells[i];
      if (c.sep) c.el.textContent = v[i];
      else this.flip(c, old[i], v[i], animate && !motion.rm);
    }
  }
  build(v: string) {
    if (!this.el) return;
    this.el.textContent = '';
    this.cells = [];
    for (const ch of v) {
      const el = document.createElement('span');
      if (/\d/.test(ch)) {
        el.className = 'fl';
        el.innerHTML = `<span class="fl__t">${ch}</span><span class="fl__b">${ch}</span><span class="fl__ft"></span><span class="fl__fb"></span>`;
        const [t, b, ft, fb] = Array.from(el.children) as HTMLElement[];
        this.cells.push({ el, t, b, ft, fb });
      } else {
        el.className = 'fsep';
        el.textContent = ch;
        this.cells.push({ sep: true, el });
      }
      this.el.append(el);
    }
  }
  flip(c: Cell, a: string, b: string, animate: boolean) {
    const { t, b: bot, ft, fb } = c as Required<Cell>;
    if (!animate) { t.textContent = bot.textContent = b; return; }
    t.textContent = b; ft.textContent = a; bot.textContent = a; fb.textContent = b;
    ft.style.visibility = 'visible';
    const a1 = play(ft, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }], { duration: 130, easing: 'ease-in', fill: 'forwards' });
    if (!a1) { bot.textContent = b; ft.style.visibility = ''; return; }
    a1.onfinish = () => {
      ft.style.visibility = ''; fb.style.visibility = 'visible';
      const a2 = play(fb, [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }], { duration: 130, easing: 'ease-out', fill: 'forwards' });
      const done = () => { bot.textContent = b; fb.style.visibility = ''; a1.cancel(); a2?.cancel(); };
      if (a2) a2.onfinish = done; else done();
    };
  }
}

/** Anton names: shrink to fit the plate (floor 24px). */
export function fitName(el: HTMLElement | null, avail: number) {
  if (!el || !(avail > 0)) return;
  el.style.fontSize = '';
  const max = parseFloat(getComputedStyle(el).fontSize), ws = el.style.whiteSpace;
  el.style.whiteSpace = 'nowrap';
  const w = el.scrollWidth;
  el.style.whiteSpace = ws;
  if (w > avail + 1) el.style.fontSize = Math.max(24, Math.floor(((max * avail) / w) * 10) / 10) + 'px';
}
export const padX = (el: Element) => { const c = getComputedStyle(el); return parseFloat(c.paddingLeft) + parseFloat(c.paddingRight); };

export const mq = (q: string) => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false);
export const MQ = { desk: '(min-width: 1100px)', wide: '(min-width: 900px)', sm: '(min-width: 600px)', tab: '(min-width: 768px)' };

export const canSurf = (box: HTMLElement | null) => !!box && !motion.rm && visible(box);
