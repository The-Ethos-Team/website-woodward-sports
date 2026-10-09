/* One story in the paper list (feature / row / card). Links out to woodwardsports.com in a new tab. */
import { nw, teamTag } from '@/lib/format';
import type { Story } from '@/lib/types';
import { NewTab } from './bits';
import { StoryImg } from './media';

export type StoryView = Story & { dateLabel: string };
export type Kind = 'feature' | 'row' | 'card';
export const kindAt = (k: number): Kind => (k === 0 ? 'feature' : k < 5 ? 'row' : 'card');
const SIZES: Record<Kind, string> = { feature: '(min-width: 900px) 58vw, 100vw', card: '(min-width: 900px) 31vw, 128px', row: '(min-width: 1100px) 136px, 128px' };

export function StoryItem({ s, kind, hidden, eager, liRef }: { s: StoryView; kind: Kind; hidden?: boolean; eager?: boolean; liRef?: (el: HTMLLIElement | null) => void }) {
  const [tag, col] = teamTag(s);
  const ring = col === '#18453B' ? ' st__dot--ring' : '';
  return (
    <li className={`st st--${kind}`} data-teams={s.teams.join(' ')} data-id={s.id} hidden={hidden} ref={liRef}>
      <a className="st__a" href={s.url} target="_blank" rel="noopener">
        <div className="st__media"><StoryImg story={s} className="st__img" sizes={SIZES[kind]} eager={eager} /></div>
        <div className="st__body">
          <p className="st__tag">
            <i className={'st__dot' + ring} style={{ ['--team' as string]: col }} />
            <span>{tag}</span>
            {s.readingMinutes ? <><span className="st__sep" aria-hidden="true">·</span><span className="st__min"><span className="nw">{s.readingMinutes} min read</span></span></> : null}
          </p>
          <h3 className="st__title">{nw(s.title)}</h3>
          <p className="st__by">{s.author} · <time className="nw" dateTime={s.date}>{s.dateLabel}</time></p>
        </div>
        <NewTab />
      </a>
    </li>
  );
}
