import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext } from '@/components/ui/bits';
import { PartnerSlot, WatchParty } from '@/components/sections/WatchParty';
import { pageMeta } from '@/lib/meta';
import { DATA, MEDIA, SOC } from '@/lib/snapshot';

export const metadata = pageMeta({
  title: 'Watch parties',
  description: 'Woodward Sports Network watch parties: Lions vs. Bills in Downtown Royal Oak, where fans voted between six bars, and the Pistons–Magic Game 7 party in New Buffalo.',
  path: '/watch-parties',
});

const RESULT: Record<string, string> = { win: 'venue__r--win', pre: 'venue__r--pre' };

export default function WatchPartiesPage() {
  const wp = DATA.watch_party;
  const g7 = wp.past_events[0];
  const key = (s?: string) => (s ?? '').toLowerCase().replace(/[’']/g, '');
  const img = (name: string) => MEDIA.party.find(p => 'venue' in p && p.venue && (key(p.venue) === key(name) || key(name).startsWith(key(p.venue).split(' ')[0]))) as
    { file: string; w: number; h: number; description: string } | undefined;
  return (
    <>
      <PageHero
        kicker="ON LOCATION · DETROIT FANS, ONE ROOM"
        title="Watch parties" dot
        sub="WSN takes the show to the bar. Fans vote on the venue, the hosts bring the noise."
        ctas={<Ext href={SOC.instagram} className="btn btn--blade btn--xl"><span>Vote on the next one</span></Ext>}
      />
      <WatchParty ch="01" />
      <section className="sec sec--ink2" aria-labelledby="venues-h">
        <div className="wrap">
          <SectionHead ch="02" name="ROYAL OAK" title="THE SIX VENUES" sub={`${wp.game} · Downtown Royal Oak`} id="venues-h" />
          <ul className="venues" data-reveal="">
            {wp.venues.map((v, i) => {
              const m = img(v.name);
              const r = /winner/i.test(v.result) ? 'win' : /2nd|pregame/i.test(v.result) ? 'pre' : '';
              return (
                <li className="venue" key={v.name} style={{ ['--i' as string]: Math.min(i, 5) }}>
                  {m ? <div className="venue__img"><img src={'/' + m.file} width={m.w} height={m.h} alt={m.description} loading="lazy" decoding="async" /></div> : null}
                  <div className="venue__body">
                    <h3 className="venue__n">{v.name}</h3>
                    <p className={'venue__r ' + (RESULT[r] ?? '')}>{v.result}</p>
                    <p className="venue__b">{v.blurb}</p>
                    {v.website ? <Ext href={v.website} className="textlink textlink--light"><span>{v.name} website</span><Arrow /></Ext> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <section className="sec sec--ink" aria-labelledby="g7-h">
        <div className="wrap two">
          <div>
            <SectionHead ch="03" name="NEW BUFFALO" title="GAME 7" id="g7-h" />
            <p className="lead">{g7.summary}</p>
            <div className="sec__foot"><Ext href={g7.url} className="btn btn--blade"><span>Read the story</span></Ext></div>
          </div>
          <div><PartnerSlot /></div>
        </div>
      </section>
    </>
  );
}
