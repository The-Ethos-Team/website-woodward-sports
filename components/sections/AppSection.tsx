import { SectionHead } from '@/components/ui/SectionHead';
import { Ext, Icon, NewTab } from '@/components/ui/bits';
import { AppButtons } from '@/components/client/AppButtons';
import { PhoneLive } from '@/components/client/PhoneLive';
import { APP, YT } from '@/lib/snapshot';

export function AppSection({ ch = '09' }: { ch?: string }) {
  return (
    <section id="app" className="sec sec--teal" aria-labelledby="app-h">
      <div className="wrap app">
        <div className="app__copy">
          <SectionHead ch={ch} name="APP" title="TAKE US WITH YOU" sub="Live, anytime, anywhere." id="app-h" />
          <p className="app__txt">{APP.name} delivers all things Detroit sports: the NFL, MLB, NBA, NHL, fantasy football and more, right on your iPhone.</p>
          <AppButtons
            store={<a key="store" className="app__store" href={APP.ios_url} target="_blank" rel="noopener"><img src="/img/badges/app-store.svg" width={180} height={60} alt={`Download ${APP.name} on the App Store`} /><NewTab /></a>}
            yt={<Ext key="yt" href={YT.live_url} className="btn btn--ghost app__yt"><Icon name="yt" /><span>YouTube Live</span></Ext>}
          />
          <p className="app__fine">iPhone app. Android? Watch on YouTube Live.</p>
        </div>
        <div className="app__stage" data-reveal="">
          <PhoneLive />
        </div>
      </div>
    </section>
  );
}
