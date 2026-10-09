import { nw } from '@/lib/format';
import type { Video } from '@/lib/types';
import { Icon, NewTab } from './bits';
import { VideoImg } from './media';

export const VRAIL_SIZES = '(min-width: 1100px) 300px, (min-width: 900px) 31vw, (min-width: 600px) 46vw, 82vw';

/** Video card: opens in the Live Room (one shared player); the link is the YouTube fallback. */
export function VideoCard({ v, i, tag, meta, sizes = VRAIL_SIZES, as = 'h3', className = 'vrail__item' }: { v: Video; i: number; tag: string; meta: string; sizes?: string; as?: 'h2' | 'h3'; className?: string }) {
  const H = as;
  return (
    <li className={className} style={{ ['--i' as string]: Math.min(i, 5) }}>
      <a className="vcard" href={v.url} target="_blank" rel="noopener" data-video={v.id} data-show={v.show ?? ''}>
        <div className="vcard__media">
          <VideoImg thumb={v.thumb} className="vcard__img" sizes={sizes} />
          <span className="vcard__tag">{tag}</span>
          <span className="vcard__play" aria-hidden="true"><Icon name="play" /></span>
        </div>
        <H className="vcard__title">{nw(v.title)}</H>
        <p className="vcard__meta">{nw(meta)}</p>
        <NewTab />
      </a>
    </li>
  );
}
