import Link from 'next/link';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext } from '@/components/ui/bits';
import { PARTY_BOARD } from '@/lib/config';
import { DATA, SOC } from '@/lib/snapshot';

export function PartyBoard() {
  return (
    <div className="board" data-reveal="">
      <div className="board__head"><span>Venue</span><span>Royal Oak · Thu 9/17/26</span></div>
      <ol className="board__rows">
        {PARTY_BOARD.map(([v, s, c], i) => (
          <li className="board__row" style={{ ['--i' as string]: i }} key={v}>
            <span className="board__venue">{v}</span>
            <span className={`board__st board__st--${c || 'st'}`}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function PartnerSlot({ k = 'Presenting partner', cta = 'Put your name on the next one' }: { k?: string; cta?: string }) {
  return (
    <Link className="slot" href="/advertise">
      <span className="slot__k">{k}</span>
      <span className="slot__v">Available</span>
      <span className="slot__cta">{cta}<Arrow /></span>
    </Link>
  );
}

export function WatchParty({ ch = '07' }: { ch?: string }) {
  const wp = DATA.watch_party;
  const g7 = wp.past_events[0];
  return (
    <section id="watch-party" className="sec sec--party" aria-labelledby="party-h">
      <div className="party__bg" aria-hidden="true">
        <img src="/img/atmo-detroit-dusk-1000.webp" srcSet="/img/atmo-detroit-dusk-1000.webp 1000w, /img/atmo-detroit-dusk.webp 2000w" sizes="100vw" width={2000} height={1125} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="wrap">
        <SectionHead ch={ch} name="ON LOCATION" title="WATCH PARTIES" id="party-h" />
        <div className="party">
          <div className="party__copy">
            <p className="party__recap"><strong>Detroit vs. Buffalo</strong> · Thursday Night Football · <span className="nw">9/17/26</span> · Downtown Royal Oak. Fans voted between 6 bars, and WSN covered <span className="nw">all six.</span></p>
            <PartyBoard />
            <p className="party__g7">Before that: the Woodward Heavyweights hosted a <Ext href={g7.url}>Pistons–Magic Game 7 watch party</Ext> at Lume’s grand opening in New Buffalo.</p>
            <div className="party__ctas">
              <Ext href={wp.post_url} className="btn btn--blade"><span>Read the recap</span></Ext>
              <Ext href={SOC.instagram} className="textlink textlink--light"><span>Catch the next vote on Instagram</span><Arrow /></Ext>
            </div>
          </div>
          <div className="party__side">
            <figure className="party__fig"><img src="/img/party/collage.webp" width={1000} height={563} alt="The six Royal Oak watch-party venues: HopCat, Rock & Brews, O’Tooles, Blind Owl, Fifth Avenue and Bar Louie" loading="lazy" decoding="async" /></figure>
            <PartnerSlot />
          </div>
        </div>
      </div>
    </section>
  );
}
