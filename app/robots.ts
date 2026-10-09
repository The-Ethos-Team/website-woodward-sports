import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Crawling is allowed; indexing is switched by the robots meta tag (lib/site.ts → INDEXING). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
