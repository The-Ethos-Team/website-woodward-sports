import Link from 'next/link';
import { Ext } from '@/components/ui/bits';
import { APP, BRAND, DATA, SOC, YT } from '@/lib/snapshot';

const NAV: [string, string][] = [
  ['Lineup', '/shows'], ['Teams', '/teams'], ['Stories', '/stories'], ['Watch', '/watch'], ['Listen', '/listen'],
  ['Watch parties', '/watch-parties'], ['Shop', '/shop'], ['App', '/app'], ['Advertise', '/advertise'],
];

export function Footer() {
  const socials: [string, string][] = [['Instagram', SOC.instagram], ['YouTube', SOC.youtube], ['TikTok', SOC.tiktok], ['Facebook', SOC.facebook], ['X', SOC.x]];
  return (
    <footer className="ftr" aria-labelledby="ftr-h">
      <div className="wrap">
        <h2 className="ftr__big" id="ftr-h">SOUND <span className="nw">OFF<span className="ftr__dot">.</span></span></h2>
        <p className="ftr__handle"><b>{SOC.handle}</b> everywhere</p>
        <ul className="ftr__soc">
          {socials.map(([n, u]) => <li key={n}><Ext href={u} className="fsoc">{n.toUpperCase()}</Ext></li>)}
        </ul>
        <div className="ftr__grid">
          <div className="ftr__about">
            <img className="ftr__logo" src="/img/logo.svg" width={96} height={96} alt="Woodward Sports Network" loading="lazy" />
            <p>{BRAND.description}</p>
            <p className="ftr__slogan">Made for the fans, made by the fans.</p>
          </div>
          <nav className="ftr__nav" aria-label="Footer">
            <ul>{NAV.map(([n, h]) => <li key={h}><Link href={h}>{n}</Link></li>)}</ul>
          </nav>
          <ul className="ftr__ext">
            <li><Ext href="https://woodwardsports.com/news/">All stories</Ext></li>
            <li><Ext href={DATA.shop.url}>Woodward Sports Store</Ext></li>
            <li><Ext href={APP.ios_url}>WSN Live! for iPhone</Ext></li>
            <li><Ext href={YT.membership_url}>Become a channel member</Ext></li>
            <li><Link href="/privacy">Privacy</Link></li>
          </ul>
        </div>
        <p className="ftr__copy">© 2026 Woodward Sports Network · <span className="nw">Detroit, the 313</span></p>
      </div>
    </footer>
  );
}
