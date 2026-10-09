import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext, Icon } from '@/components/ui/bits';
import { VideoCard } from '@/components/ui/VideoCard';
import { RailNav } from '@/components/client/RailNav';
import { YT } from '@/lib/snapshot';
import { videoMeta, videoTag } from '@/lib/data/site';
import type { Video } from '@/lib/types';

/** Replays rail: full shows and clips; a card plays in the Live Room. */
export function Replays({ videos, ch = '05', title = 'REPLAYS', name = 'WATCH', sub = 'Full shows and clips, fresh off the stream. Tap one to watch it right here.', id = 'watch', railId = 'vrail' }: { videos: Video[]; ch?: string; title?: string; name?: string; sub?: string; id?: string; railId?: string }) {
  return (
    <section id={id} className="sec sec--ink" aria-labelledby={id + '-h'}>
      <div className="wrap sh-row">
        <SectionHead ch={ch} name={name} title={title} sub={sub} id={id + '-h'} />
        <RailNav rail={railId} />
      </div>
      <ul className="vrail" id={railId} data-reveal="" aria-label="Latest videos">
        {videos.map((v, i) => <VideoCard key={v.id} v={v} i={i} tag={videoTag(v)} meta={videoMeta(v)} />)}
      </ul>
      <div className="wrap watch__foot">
        <Ext href={YT.url + '?sub_confirmation=1'} className="btn btn--yt"><Icon name="yt" /><span>Subscribe on YouTube</span></Ext>
        <Ext href={YT.videos_url} className="textlink textlink--light"><span>All videos on YouTube</span><Arrow /></Ext>
      </div>
    </section>
  );
}
