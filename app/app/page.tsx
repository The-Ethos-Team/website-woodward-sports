import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Ext, Icon, NewTab } from '@/components/ui/bits';
import { AppSection } from '@/components/sections/AppSection';
import { pageMeta } from '@/lib/meta';
import { APP, YT } from '@/lib/snapshot';

export const metadata = pageMeta({
  title: 'WSN Live! app',
  description: 'WSN Live! for iPhone: all things Detroit sports, live. The NFL, MLB, NBA, NHL, fantasy football and more. Android? Watch on YouTube Live.',
  path: '/app',
});

export default function AppPage() {
  return (
    <>
      <PageHero
        kicker="THE APP · IPHONE"
        title={APP.name}
        sub="Live, anytime, anywhere. All things Detroit sports, right on your iPhone."
        ctas={<>
          <a className="app__store" href={APP.ios_url} target="_blank" rel="noopener"><img src="/img/badges/app-store.svg" width={180} height={60} alt={`Download ${APP.name} on the App Store`} /><NewTab /></a>
          <Ext href={YT.live_url} className="btn btn--ghost app__yt"><Icon name="yt" /><span>YouTube Live</span></Ext>
        </>}
      />
      <AppSection ch="01" />
      <section className="sec sec--ink" aria-labelledby="info-h">
        <div className="wrap">
          <SectionHead ch="02" name="DETAILS" title="THE DETAILS" id="info-h" />
          <dl className="facts">
            <div><dt>Price</dt><dd>{APP.price}<small>App Store, United States</small></dd></div>
            <div><dt>Requires</dt><dd>iOS {APP.minimum_ios} or later<small>iPhone</small></dd></div>
            <div><dt>Android</dt><dd>YouTube Live<small>No Android app right now</small></dd></div>
            <div><dt>Seller</dt><dd>{APP.seller}<small>Version {APP.current_version}</small></dd></div>
          </dl>
        </div>
      </section>
    </>
  );
}
