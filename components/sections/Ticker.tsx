import Link from 'next/link';
import type { Story } from '@/lib/types';
import { teamTag } from '@/lib/format';
import { Dot, NewTab } from '@/components/ui/bits';
import { TickerShell } from '@/components/client/TickerShell';

/** Headline crawl (global, in the layout). Two copies of the list for a seamless loop; the copy is aria-hidden. */
export function Ticker({ stories }: { stories: Story[] }) {
  const pick = stories.slice(0, 8);
  const list = (dup: boolean) => {
    const tab = dup ? -1 : undefined;
    const seq: React.ReactNode[] = [
      <li key="live"><span className="tk-live"><Dot />LIVE SHOWS EVERY WEEKDAY <span className="nw">8AM–7PM ET</span></span></li>,
    ];
    pick.forEach((a, i) => {
      const [tag] = teamTag(a);
      seq.push(
        <li key={'a' + a.id}>
          <a href={a.url} target="_blank" rel="noopener" tabIndex={tab}><em>{tag.toUpperCase()}</em> {a.title}<NewTab /></a>
        </li>,
      );
      if (i === 2) seq.push(<li key="ad"><Link className="tk-ad" href="/advertise" tabIndex={tab}>THIS SPOT IS AVAILABLE · ADVERTISE WITH WSN</Link></li>);
      if (i === 4) seq.push(<li key="slogan"><span className="tk-slogan">MADE FOR THE FANS, MADE BY THE FANS</span></li>);
    });
    const out: React.ReactNode[] = [];
    seq.forEach((n, i) => { out.push(n, <li key={'s' + i} className="tk-sep" aria-hidden="true">{'/////'}</li>); });
    return out;
  };
  return (
    <TickerShell>
      <ul className="ticker__list">{list(false)}</ul>
      <ul className="ticker__list" aria-hidden="true">{list(true)}</ul>
    </TickerShell>
  );
}
