'use client';
/* Shared overlay stack: page lock, inert background, Esc to close the top one, focus trap. */
import { motion } from './motion';

export interface DialogEntry { el: HTMLElement; close: () => void }
export const stack: DialogEntry[] = [];
export const FOCUSABLE = 'a[href], button:not([disabled]):not([hidden]), input, [tabindex]:not([tabindex="-1"])';

function setInert(on: boolean) {
  ['main', '.ftr', '.hdr', '.dock'].forEach(s => {
    const el = document.querySelector<HTMLElement>(s);
    if (el) el.inert = on;
  });
}
export function lock(on: boolean) {
  const H = document.documentElement;
  H.classList.toggle('is-locked', on);
  H.classList.toggle('is-overlay', on);
  setInert(on);
}
export function push(d: DialogEntry) {
  if (!stack.some(x => x.el === d.el)) stack.push(d);
  lock(true);
}
export function pull(el: HTMLElement) {
  const i = stack.findIndex(x => x.el === el);
  if (i > -1) stack.splice(i, 1);
  if (!stack.length) lock(false);
}
export const inStack = (el: HTMLElement) => stack.some(x => x.el === el);

let installed = false;
export function installDialogKeys() {
  if (installed) return;
  installed = true;
  addEventListener('keydown', e => {
    const top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') { e.preventDefault(); top.close(); return; }
    if (e.key === 'Tab') {
      const f = Array.from(top.el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(x => x.getClientRects().length && !x.closest('[hidden]'));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
      else if (!top.el.contains(a)) { e.preventDefault(); first.focus(); }
    }
  });
}

/** focus without a visible ring when the overlay was opened by touch or mouse */
export function focusQuiet(el: HTMLElement | null | undefined) {
  el?.focus({ preventScroll: true, focusVisible: motion.kbdNav } as FocusOptions);
}
