import { videoMeta, videoTag } from '@/lib/data/site';
import type { Video } from '@/lib/types';
import { VideoCard } from './VideoCard';

export function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <ul className="vgrid" data-reveal="">
      {videos.map((v, i) => (
        <VideoCard key={v.id} v={v} i={i} tag={videoTag(v)} meta={videoMeta(v)} className="vgrid__item"
          sizes="(min-width: 1100px) 300px, (min-width: 900px) 31vw, (min-width: 600px) 46vw, 100vw" />
      ))}
    </ul>
  );
}
