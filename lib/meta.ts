import type { Metadata } from 'next';
import { OG_ALT, SITE_NAME } from './site';

/** Per-page metadata: title (layout template adds the network name), description, canonical, OG/Twitter. */
export function pageMeta({ title, description, path, image }: { title: string; description: string; path: string; image?: string }): Metadata {
  const img = image ?? '/img/og-image.jpg';
  const full = `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: SITE_NAME, title: full, description, url: path, images: [{ url: img, width: image ? 900 : 1200, height: image ? 900 : 630, alt: image ? title : OG_ALT }] },
    twitter: { card: image ? 'summary' : 'summary_large_image', site: '@woodwardsports', title: full, description, images: [img] },
  };
}
