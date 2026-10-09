/* Images. Local files in /public are pre-sized webp with hand-written srcset; remote images from live sources
   (YouTube, Shopify) go through next/image (domains in next.config images.remotePatterns). WordPress images are
   loaded straight from woodwardsports.com (its own size variants), because Cloudflare can block Vercel's optimizer. */
import { getImageProps } from 'next/image';
import type { Img, Story, VideoThumb } from '@/lib/types';

type Load = { eager?: boolean; high?: boolean };

function remote(src: string, w: number, h: number, sizes: string, className: string, alt: string, o: Load) {
  const { props } = getImageProps({ src, width: w, height: h, sizes, alt, loading: o.eager || o.high ? 'eager' : 'lazy', fetchPriority: o.high ? 'high' : undefined });
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} className={className} decoding="async" style={undefined} />;
}

export function VideoImg({ thumb, className, sizes, hero = false, eager = false }: { thumb: VideoThumb; className: string; sizes: string; hero?: boolean; eager?: boolean }) {
  if (!thumb.local) return remote(hero && thumb.lg ? thumb.lg : thumb.md, 1280, 720, sizes, className, '', { high: hero, eager });
  const srcSet = `${thumb.sm} 480w, ${thumb.md} 960w` + (hero && thumb.lg ? `, ${thumb.lg} 1280w` : '');
  return (
    <img className={className} src={thumb.md} srcSet={srcSet} sizes={sizes} width={1280} height={720} alt=""
      loading={hero || eager ? undefined : 'lazy'} fetchPriority={hero ? 'high' : undefined} decoding="async" />
  );
}

export function StoryImg({ story, className, sizes, eager = false }: { story: Story; className: string; sizes: string; eager?: boolean }) {
  const m = story.image;
  if (!m) return <img className={className} src="/img/atmo-banner-1000.webp" width={1000} height={562} alt="" loading="lazy" decoding="async" />;
  return <img className={className} src={m.src} srcSet={m.srcSet} sizes={sizes} width={m.w} height={m.h} alt={m.alt} loading={eager ? undefined : 'lazy'} decoding="async" />;
}

export function ProductImg({ img, sizes }: { img: Img; sizes: string }) {
  if (!img.local) return remote(img.src, img.w, img.h, sizes, '', img.alt, {});
  return <img src={img.src} width={img.w} height={img.h} alt={img.alt} loading="lazy" decoding="async" />;
}
