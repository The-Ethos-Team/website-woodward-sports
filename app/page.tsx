import type { Metadata } from 'next';
import { Hero } from '@/components/sections/Hero';
import { Lineup } from '@/components/sections/Lineup';
import { Teams, tileHeads } from '@/components/sections/Teams';
import { Tapes } from '@/components/sections/Tapes';
import { Stories } from '@/components/sections/Stories';
import { Replays } from '@/components/sections/Replays';
import { Listen } from '@/components/sections/Listen';
import { WatchParty } from '@/components/sections/WatchParty';
import { Shop } from '@/components/sections/Shop';
import { AppSection } from '@/components/sections/AppSection';
import { Advertise } from '@/components/sections/Advertise';
import { getLatestEpisodes, getProducts, getStories, getTeamStories, getVideos } from '@/lib/data';
import { BRAND } from '@/lib/snapshot';
import { SITE_TITLE } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: BRAND.description,
  alternates: { canonical: '/' },
};

export default async function Home() {
  const [{ videos }, latest, teamStories, eps, { products }] = await Promise.all([
    getVideos(), getStories({ perPage: 20 }), getTeamStories(), getLatestEpisodes(), getProducts(),
  ]);
  return (
    <>
      <div className="top">
        <Hero />
      </div>
      <Lineup />
      <Teams heads={tileHeads(teamStories)} />
      <Tapes />
      <Stories stories={latest.items} />
      <Replays videos={videos} />
      <Listen latest={eps} />
      <WatchParty />
      <Shop products={products} />
      <AppSection />
      <Advertise />
    </>
  );
}
