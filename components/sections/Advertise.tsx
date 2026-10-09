import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Icon } from '@/components/ui/bits';
import { CONTACT, INVENTORY } from '@/lib/config';
import { nw } from '@/lib/format';

export function AdvertiseCta() {
  return (
    <div className="adv__cta">
      <a className="btn btn--blade btn--xl" href={CONTACT.primary} target="_blank" rel="noopener"><Icon name="chat" /><span>Advertise with WSN</span><span className="sr-only"> (opens Instagram in a new tab)</span></a>
      <a className="textlink textlink--light" href={CONTACT.alt} target="_blank" rel="noopener"><span>Prefer Messenger? Message us on <span className="nw">Facebook<Arrow /></span></span><span className="sr-only"> (opens in new tab)</span></a>
    </div>
  );
}

export function Inventory() {
  return (
    <>
      <p className="invs__lbl">Ideas to ask us about</p>
      <ol className="invs" data-reveal="">
        {INVENTORY.map(([t, d], i) => (
          <li className="inv" style={{ ['--i' as string]: Math.min(i, 5) }} key={t}>
            <span className="inv__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="inv__t">{nw(t)}</h3>
            <p className="inv__d">{nw(d)}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

export function Advertise({ ch = '10', as = 'h2' }: { ch?: string; as?: 'h1' | 'h2' }) {
  return (
    <section id="advertise" className="sec sec--ink" aria-labelledby="adv-h">
      <div className="wrap">
        <SectionHead ch={ch} name="ADVERTISE" title="YOUR BRAND. ON AIR." sub="Put your brand inside Detroit’s loudest sports conversation: live every weekday, on demand all week." id="adv-h" as={as} />
        <div className="adv">
          <div className="demo" aria-label="Demo: how a sponsor appears on the WSN stream" role="img" data-demo="">
            <img className="demo__img" src="/img/atmo-arena-bowl-1000.webp" srcSet="/img/atmo-arena-bowl-1000.webp 1000w, /img/atmo-arena-bowl.webp 2000w" sizes="(min-width: 1100px) 640px, 100vw" width={2000} height={1125} alt="" loading="lazy" decoding="async" />
            <span className="bug bug--air bug--demo"><i className="bug__dot" />LIVE</span>
            <span className="demo__logo"><img src="/img/logo.svg" width={56} height={56} alt="" /></span>
            <div className="demo__l3 blade"><span className="demo__kick">PRESENTED BY</span><b>YOUR BRAND</b></div>
            <div className="demo__tk"><span className="demo__tkk">SPONSOR</span><span>THIS SPOT IS AVAILABLE<span className="demo__tkx"> · YOUR BRAND HERE</span>{' /////'}</span></div>
            <span className="demo__tag">DEMO</span>
          </div>
          <div className="adv__side">
            <dl className="stats">
              <div><dt>Subscribers</dt><dd>111K</dd></div>
              <div><dt>Views</dt><dd>163M+</dd></div>
              <div><dt>Videos</dt><dd>22K+</dd></div>
            </dl>
            <p className="stats__src">YouTube, <span className="nw">Oct 2026</span> · @WoodwardSports</p>
            <AdvertiseCta />
          </div>
        </div>
        <Inventory />
      </div>
    </section>
  );
}
