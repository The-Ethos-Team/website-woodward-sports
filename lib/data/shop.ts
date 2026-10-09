import 'server-only';
/* Merch: only the curated 8 from data/shop.json (by handle), with live price and image from Shopify when available. */
import { REVALIDATE } from '@/lib/site';
import { SHOP_SNAPSHOT } from '@/lib/snapshot';
import { PRODUCT_TEAMS } from '@/lib/config';
import { curly } from '@/lib/format';
import type { Product } from '@/lib/types';
import { getJSON } from './fetcher';

type ShopifyProduct = {
  product: {
    handle: string; title: string;
    variants: { price: string; available?: boolean }[];
    image: { src: string; width: number; height: number; alt: string | null } | null;
  };
};

export async function getProducts(): Promise<{ products: Product[]; live: boolean }> {
  let anyLive = false;
  const products = await Promise.all(SHOP_SNAPSHOT.map(async p => {
    const base: Product = {
      handle: p.handle, title: curly(p.title), url: p.url, price: p.price,
      image: { src: '/' + p.image, w: p.image_w, h: p.image_h, alt: p.image_alt, local: true },
      teams: PRODUCT_TEAMS[p.handle] ?? [],
    };
    const r = await getJSON<ShopifyProduct>(`https://shop.woodwardsports.com/products/${p.handle}.json`, { revalidate: REVALIDATE.shop, tags: ['shop'] });
    const live = r?.data?.product;
    if (!live) return base;
    anyLive = true;
    const prices = live.variants.map(v => parseFloat(v.price)).filter(n => isFinite(n));
    const price = prices.length ? Math.min(...prices).toFixed(2) : p.price;
    const img = live.image;
    return {
      ...base, price,
      image: img ? { src: img.src, w: img.width || 1000, h: img.height || 1000, alt: p.image_alt, local: false } : base.image,
    };
  }));
  return { products, live: anyLive };
}
