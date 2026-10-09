import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext, Icon } from '@/components/ui/bits';
import { VideoGrid } from '@/components/ui/VideoGrid';
import { Lineup } from '@/components/sections/Lineup';
import { HeroFacade } from '@/components/client/HeroFacade';
import { getVideos } from '@/lib/data';
import { pageMeta } from '@/lib/meta';
import { YT } from '@/lib/snapshot';

export const metadata = pageMeta({
  title: 'Watch',
  description: 'Watch Woodward Sports Network live every weekday, 8AM–7PM ET, in the WSN Live Room. Full episodes, Shorts and replays from the YouTube channel.',
  path: '/watch',
});

export default async function WatchPage() {
  const { videos } = await getVideos();
  const full = videos.filter(v => !v.isShort), shorts = videos.filter(v => v.isShort);
  return (
    <>
      <PageHero
        kicker={<>LIVE ROOM · <span className="nw">MON–FRI 8AM–7PM ET</span></>}
        title="Watch" dot
        sub="Live shows every weekday. Replays all week. One player that follows you around the site."
        ctas={<>
          <a className="btn btn--blade btn--xl" href={YT.live_url} target="_blank" rel="noopener" data-live-open=""><Icon name="play" /><span>Watch Live</span><span className="sr-only"> (opens in new tab)</span></a>
          <Ext href={YT.url + '?sub_confirmation=1'} className="btn btn--yt"><Icon name="yt" /><span>Subscribe</span></Ext>
        </>}
        aside={<HeroFacade />}
      />
      <Lineup mode="link" ch="01" />
      <section className="sec sec--ink2" aria-labelledby="full-h">
        <div className="wrap">
          <SectionHead ch="02" name="WATCH" title="FULL EPISODES" sub="Full shows and clips, fresh off the stream. Tap one to watch it right here." id="full-h" />
          <VideoGrid videos={full} />
        </div>
      </section>
      {shorts.length ? (
        <section className="sec sec--ink" aria-labelledby="shorts-h">
          <div className="wrap">
            <SectionHead ch="03" name="SHORTS" title="SHORTS" sub="The quick hits." id="shorts-h" />
            <VideoGrid videos={shorts} />
          </div>
        </section>
      ) : null}
      <section className="sec sec--teal" aria-labelledby="sub-h">
        <div className="wrap">
          <SectionHead ch="04" name="YOUTUBE" title="NEVER MISS A SHOW" sub="Subscribe to @WoodwardSports, or become a channel member." id="sub-h" />
          <div className="sec__foot">
            <Ext href={YT.url + '?sub_confirmation=1'} className="btn btn--yt"><Icon name="yt" /><span>Subscribe on YouTube</span></Ext>
            <Ext href={YT.membership_url} className="btn btn--ghost"><span>Become a channel member</span></Ext>
            <Ext href={YT.videos_url} className="textlink textlink--light"><span>All videos on YouTube</span><Arrow /></Ext>
          </div>
        </div>
      </section>
    </>
  );
}
