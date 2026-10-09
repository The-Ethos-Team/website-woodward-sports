import { PageHero } from '@/components/ui/PageHero';
import { Icon } from '@/components/ui/bits';
import { Lineup } from '@/components/sections/Lineup';
import { Listen } from '@/components/sections/Listen';
import { getLatestEpisodes } from '@/lib/data';
import { pageMeta } from '@/lib/meta';
import { YT } from '@/lib/snapshot';
import Link from 'next/link';

export const metadata = pageMeta({
  title: 'The Lineup',
  description: 'Four live shows every weekday, 8AM–7PM ET: Big D Energy, Crunch Time, The Braylon Edwards Show and Woodward Heavyweights. Watch live on YouTube or listen as a podcast.',
  path: '/shows',
});

export default async function ShowsPage() {
  const eps = await getLatestEpisodes();
  return (
    <>
      <PageHero
        kicker={<>THE NETWORK · <span className="nw">MON–FRI 8AM–7PM ET</span></>}
        title="Shows" dot
        sub="Every take. Every host. All the noise. Welcome to the Detroit sports mothership."
        ctas={<>
          <a className="btn btn--blade btn--xl" href={YT.live_url} target="_blank" rel="noopener" data-live-open=""><Icon name="play" /><span>Watch Live</span><span className="sr-only"> (opens in new tab)</span></a>
          <Link className="btn btn--ghost" href="/listen"><Icon name="listen" /><span>Listen</span></Link>
        </>}
      />
      <Lineup mode="link" ch="01" />
      <Listen latest={eps} ch="02" />
    </>
  );
}
