import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Ext } from '@/components/ui/bits';
import { PodLinks } from '@/components/sections/Listen';
import { getAllEpisodes } from '@/lib/data';
import { duration, fdate, nw, slotShort } from '@/lib/format';
import { pageMeta } from '@/lib/meta';
import { SHOWS, showArt } from '@/lib/snapshot';

export const metadata = pageMeta({
  title: 'Listen',
  description: 'All four Woodward Sports Network shows as podcasts: Big D Energy, Crunch Time Sports, The Braylon Edwards Show and Woodward Heavyweights. Apple Podcasts, Spotify and RSS.',
  path: '/listen',
});

export default async function ListenPage() {
  const all = await getAllEpisodes(4);
  return (
    <>
      <PageHero
        kicker={<>PODCASTS · <span className="nw">MON–FRI</span></>}
        title="Listen" dot
        sub="Every show, every weekday, as a podcast. Missed the stream? Take it with you."
      />
      <section id="listen" className="sec sec--grad" aria-labelledby="listen-h">
        <div className="wrap">
          <SectionHead ch="01" name="LISTEN" title="TURN IT UP." sub="Play the latest episodes right here, or follow the show in your podcast app." id="listen-h" />
          <ul className="podlist pods--list" data-reveal="">
            {SHOWS.map((s, i) => (
              <li className="pod pod--wide" key={s.id} data-show={s.id} style={{ ['--i' as string]: i }}>
                <div className="pod__top">
                  <img className="pod__art" src={showArt(s.id).sm} width={480} height={480} alt="" loading="lazy" decoding="async" />
                  <div className="pod__id">
                    <h3 className="pod__name">{s.podcast_name}</h3>
                    <p className="pod__meta"><span className="nw">{slotShort(s)} ·</span> <span className="nw">MON–FRI</span></p>
                  </div>
                </div>
                <ul className="eps">
                  {all[s.id].episodes.map(e => (
                    <li className="ep" key={e.url}>
                      <p className="ep__meta">{fdate(e.published)}{e.durationSeconds ? ' · ' + duration(e.durationSeconds) : ''}</p>
                      <h4 className="ep__t"><Ext href={e.url}>{nw(e.title)}</Ext></h4>
                      {e.audioUrl ? <audio controls preload="none" src={e.audioUrl} aria-label={`Play: ${e.title}`} /> : null}
                    </li>
                  ))}
                </ul>
                <PodLinks s={s} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
