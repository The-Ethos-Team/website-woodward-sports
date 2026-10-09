import { BLADE_W } from '@/lib/config';
import { nw } from '@/lib/format';

/** Section head: rotated CH kicker, H2 blade (fit-to-width via --bw), optional sub. */
export function SectionHead({ ch, name, title, sub, id, as = 'h2' }: { ch: string; name: string; title: string; sub?: string; id: string; as?: 'h1' | 'h2' }) {
  const words = title.split(' ');
  const last = words.pop()!;
  const head = words.join(' ');
  const H = as;
  const bw = BLADE_W[title] ?? Math.max(4.4, Math.round((title.length * 0.47 + 0.85) * 10) / 10);
  return (
    <header className="sh" data-reveal-head="">
      <p className="sh__kicker">
        <span>
          <b className="sh__ch">CH {ch}</b> — {name}
        </span>
      </p>
      <H className="blade sh__blade" id={id} style={{ ['--bw' as string]: bw }}>
        <span className="mask">
          <span className="mask__in">
            {head ? head + ' ' : ''}
            <span className="nw">{last}</span>
          </span>
        </span>
      </H>
      {sub ? <p className="sh__sub">{nw(sub)}</p> : null}
    </header>
  );
}
