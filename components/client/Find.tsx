'use client';
/* Find (⌘K / Ctrl+K / "/"): shows, teams, stories, videos. Grouped results, <mark> highlights, ↑↓ Enter Esc. */
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { TEAM } from '@/lib/config';
import { bus, register } from '@/lib/ui/bus';
import { pull, push, stack } from '@/lib/ui/dialogs';
import { motion } from '@/lib/ui/motion';
import { Icon } from '@/components/ui/bits';
import type { FindItem, TeamId } from '@/lib/types';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'");
const GROUPS: [FindItem['type'], string][] = [['show', 'SHOWS'], ['team', 'TEAMS'], ['story', 'STORIES'], ['video', 'VIDEOS']];
const VERB = { show: 'Open', team: 'Open', story: 'Read', video: 'Play' } as const;

function Hl({ title, toks }: { title: string; toks: string[] }) {
  const ts = toks.filter(t => t.length > 1).sort((a, b) => b.length - a.length);
  if (!ts.length) return <>{title}</>;
  const re = new RegExp('(' + ts.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'ig');
  return <>{title.split(re).map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p))}</>;
}

export function Find({ index, shows }: { index: FindItem[]; shows: { id: string; short: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const idx = useMemo(() => index.map(x => ({ ...x, hay: norm(x.title + ' ' + x.keys), t: norm(x.title) })), [index]);

  const tk = norm(q).trim();
  const toks = tk.split(/\s+/).filter(Boolean);
  const groups = useMemo(() => {
    const toks = tk.split(/\s+/).filter(Boolean);
    if (!toks.length) return [];
    return GROUPS.map(([type, label]) => ({
      type, label,
      hits: idx.filter(x => x.type === type && toks.every(t => x.hay.includes(t)))
        .map(x => ({ x, sc: (x.t.startsWith(toks[0]) ? 3 : 0) + (toks.every(t => x.t.includes(t)) ? 2 : 0) }))
        .sort((a, b) => b.sc - a.sc).slice(0, 5).map(h => h.x),
    })).filter(g => g.hits.length);
  }, [idx, tk]);
  const opts = groups.flatMap(g => g.hits);

  const close = useCallback((returnFocus = true) => {
    if (!root.current) return;
    setShown(false);
    pull(root.current);
    setTimeout(() => setOpen(o => (root.current?.classList.contains('is-open') ? o : false)), motion.rm ? 160 : 430);
    if (returnFocus && opener.current?.isConnected) opener.current.focus({ preventScroll: true });
  }, []);

  const openFind = useCallback((op?: HTMLElement | null) => {
    opener.current = op ?? document.querySelector<HTMLElement>('[data-find-open]');
    flushSync(() => { setQ(''); setActive(-1); setOpen(true); });
    if (root.current) push({ el: root.current, close: () => close() });
    input.current?.focus({ preventScroll: true });
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  }, [close]);

  useEffect(() => register('openFind', openFind), [openFind]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = document.activeElement as HTMLElement | null;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(a?.tagName ?? '') || a?.isContentEditable;
      const isOpen = !!root.current && !root.current.hidden;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (isOpen) close(); else openFind(); }
      else if (e.key === '/' && !typing && !isOpen && !stack.length) { e.preventDefault(); openFind(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [openFind, close]);

  const act = (x?: FindItem) => {
    if (!x) return;
    if (x.type === 'story') { window.open(x.target, '_blank', 'noopener'); close(); return; }
    close(false);
    if (x.type === 'video') bus.openLive({ video: x.target, opener: document.querySelector<HTMLElement>('[data-find-open]') });
    else router.push(x.target);
  };

  useEffect(() => {
    if (active < 0) return;
    document.getElementById(`fo-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  let k = -1;
  return (
    <div className={'find' + (shown ? ' is-open' : '')} id="find" role="dialog" aria-modal="true" aria-label="Find on WSN" hidden={!open} ref={root}>
      <div className="find__backdrop" onClick={() => close()} />
      <div className="find__panel">
        <h2 className="sr-only">Find on WSN</h2>
        <div className="find__bar">
          <Icon name="search" />
          <input
            id="find-input" ref={input} type="search" role="combobox" aria-expanded={opts.length > 0} aria-controls="find-results" aria-autocomplete="list"
            aria-activedescendant={active >= 0 && opts.length ? `fo-${active}` : undefined}
            autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="search" placeholder="Shows, teams, stories…" value={q}
            onChange={e => { setQ(e.target.value); setActive(0); }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); if (opts.length) setActive(a => (a + 1) % opts.length); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); if (opts.length) setActive(a => (a - 1 + opts.length) % opts.length); }
              else if (e.key === 'Enter') { e.preventDefault(); act(opts[Math.max(0, active)]); }
            }}
          />
          <button className="find__esc" type="button" onClick={() => close()}>
            <span className="find__esc-k" aria-hidden="true">Esc</span><span className="find__esc-t" aria-hidden="true">Close</span><span className="sr-only">Close search</span>
          </button>
        </div>
        <div className="find__body">
          <div className="find__empty" hidden={toks.length > 0}>
            <p className="find__lbl">Teams</p>
            <div className="find__chips">
              {(Object.keys(TEAM) as TeamId[]).map(t => (
                <button key={t} className="fx" type="button" style={{ ['--team' as string]: TEAM[t].color }} onClick={() => { close(false); router.push(`/teams/${t}`); }}><i />{TEAM[t].big}</button>
              ))}
            </div>
            <p className="find__lbl">Shows</p>
            <div className="find__chips">
              {shows.map(s => <button key={s.id} className="fx" type="button" onClick={() => { close(false); router.push(`/shows/${s.id}`); }}>{s.short}</button>)}
            </div>
          </div>
          <div id="find-results" role="listbox" aria-label="Results">
            {groups.map(g => (
              <div className="fgroup" role="group" aria-label={g.label.toLowerCase()} key={g.type}>
                <p className="fgroup__h" aria-hidden="true">{g.label}</p>
                {g.hits.map(x => {
                  k++;
                  const kk = k;
                  return (
                    <div className="fres" role="option" id={`fo-${kk}`} key={g.type + x.target} aria-selected={kk === active} onClick={() => act(x)} onMouseMove={() => setActive(kk)}>
                      <span className="fres__t"><Hl title={x.title} toks={toks} /></span>
                      <span className="fres__k">{VERB[x.type]}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="find__none" hidden={!toks.length || opts.length > 0}>No matches. Try a team, a show or a host.</p>
        </div>
      </div>
    </div>
  );
}
