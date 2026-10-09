import { Icon, Slashes } from '@/components/ui/bits';
import { HeroFacade } from '@/components/client/HeroFacade';
import { YT } from '@/lib/snapshot';

/** Home hero: wall, H1, live player facade (client island), CTAs. */
export function Hero() {
  const wallRow = 'WOODWARD SPORTS WOODWARD SPORTS WOODWARD SPORTS';
  return (
    <section id="live" className="hero" aria-labelledby="hero-h">
      <div className="wall" aria-hidden="true">
        {[0, 1, 2, 3].map(i => (
          <div className="wall__row" style={{ ['--r' as string]: i }} key={i}><span>{wallRow}</span><span>{wallRow}</span></div>
        ))}
      </div>
      <div className="wrap hero__grid">
        <p className="hero__kicker kicker">
          <Slashes />
          <span className="hero__kick">
            <span className="live-dot" aria-hidden="true" />
            <span className="hk"><span>LIVE SHOWS EVERY WEEKDAY</span><span className="hk__t"><span className="hk__sep"> · </span><span className="nw">8AM–7PM ET</span></span></span>
          </span>
        </p>
        <h1 className="hero__h1" id="hero-h">
          <span className="ln"><span className="ln__in" style={{ ['--i' as string]: 0 }}>UNFILTERED</span></span>{' '}
          <span className="ln"><span className="ln__in" style={{ ['--i' as string]: 1 }}>DETROIT</span></span>{' '}
          <span className="ln"><span className="ln__in" style={{ ['--i' as string]: 2 }}>SPORTS<span className="h1__dot">.</span></span></span>
        </h1>
        <div className="hero__player">
          <HeroFacade />
        </div>
        <div className="hero__ctas">
          <a className="btn btn--blade btn--xl" href={YT.live_url} target="_blank" rel="noopener" data-live-open="">
            <Icon name="play" /><span>Watch Live</span><span className="sr-only"> (opens in new tab)</span>
          </a>
          <a className="btn btn--ghost" href="#listen"><Icon name="listen" /><span>Listen</span></a>
          <a className="btn btn--ghost" href="#lineup"><Icon name="shows" /><span>Lineup</span></a>
        </div>
        <p className="hero__note">No corporate BS, just real Detroit sports talk.</p>
      </div>
    </section>
  );
}
