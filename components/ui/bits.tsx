/* Small presentational pieces shared by server and client components. */
import type { CSSProperties, ReactNode } from 'react';

export function Icon({ name, cls = 'ico' }: { name: string; cls?: string }) {
  return (
    <svg className={cls} aria-hidden="true" focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  );
}

export const Arrow = () => <Icon name="arrow" cls="ico ico--arrow" />;
export const NewTab = () => <span className="sr-only"> (opens in new tab)</span>;
/** ● is not in the web fonts: CSS dot instead */
export const Dot = () => <i className="dot" aria-hidden="true" />;

export function Slashes() {
  return (
    <span className="slashes" aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  );
}

/** Outbound link: new tab, rel=noopener, hidden "(opens in new tab)". */
export function Ext({ href, className, children, style, ...rest }: { href: string; className?: string; children: ReactNode; style?: CSSProperties; [k: `data-${string}`]: string | undefined }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener" style={style} {...rest}>
      {children}
      <NewTab />
    </a>
  );
}

/** digits: tabular, zero tracking; colons stay proportional */
export function Num({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\d+(?::\d+)*/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const segs = m[0].split(':');
    out.push(
      <span className="n" key={k++}>
        {segs.map((s, i) => (i ? [<span className="cn" key={'c' + i}>:</span>, s] : s))}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export function Sprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="i-search" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></g></symbol>
      <symbol id="i-play" viewBox="0 0 24 24"><path fill="currentColor" d="M7 4.6v14.8a1 1 0 0 0 1.5.86l12.3-7.4a1 1 0 0 0 0-1.72L8.5 3.74A1 1 0 0 0 7 4.6z" /></symbol>
      <symbol id="i-pause" viewBox="0 0 24 24"><path fill="currentColor" d="M6 4h4.2v16H6zM13.8 4H18v16h-4.2z" /></symbol>
      <symbol id="i-close" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></symbol>
      <symbol id="i-chev-l" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" /></symbol>
      <symbol id="i-chev-r" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></symbol>
      <symbol id="i-chev-d" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M5 9l7 7 7-7" /></symbol>
      <symbol id="i-shows" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><rect x="3" y="6.5" width="18" height="13" rx="2" /><path d="M8 2.8 12 6.5l4-3.7" /></g></symbol>
      <symbol id="i-teams" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3z" /></symbol>
      <symbol id="i-listen" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 15.5V12a8 8 0 0 1 16 0v3.5" /><rect x="3.5" y="14" width="4.5" height="6.5" rx="1.5" /><rect x="16" y="14" width="4.5" height="6.5" rx="1.5" /></g></symbol>
      <symbol id="i-shop" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d="M5 8h14l-1 12.5H6L5 8z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></g></symbol>
      <symbol id="i-rss" viewBox="0 0 24 24"><g fill="currentColor"><circle cx="6" cy="18" r="2.1" /><path d="M4 10.4v2.7a6.9 6.9 0 0 1 6.9 6.9h2.7A9.6 9.6 0 0 0 4 10.4zm0-5.3v2.7A12.2 12.2 0 0 1 16.2 20h2.7A14.9 14.9 0 0 0 4 5.1z" /></g></symbol>
      <symbol id="i-pod" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></g></symbol>
      <symbol id="i-spotify" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9.3" /><path d="M7 9.6c3.5-1 7.4-.7 10.3 1M7.6 12.9c2.9-.8 6-.5 8.3.9M8.2 15.9c2.3-.6 4.6-.4 6.4.7" /></g></symbol>
      <symbol id="i-yt" viewBox="0 0 24 24"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" /></symbol>
      <symbol id="i-ext" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M9 7h8v8" /></symbol>
      <symbol id="i-arrow" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" /></symbol>
      <symbol id="i-chat" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" d="M4 5h16v11H9.5L4 20V5z" /></symbol>
    </svg>
  );
}
