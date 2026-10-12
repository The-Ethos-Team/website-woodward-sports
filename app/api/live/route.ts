/* Is the channel streaming right now? Reads the channel's /live page: while a stream is on, YouTube points its
   canonical link at the video and marks it "isLiveNow". Cached 60 s at the edge; the Live Room asks this before it
   loads the live player, so a late start or a day off shows the latest episode instead of a dead stream.
   { live: true, id } · { live: false } · { live: null } when YouTube can't be read (the player then tries anyway). */
import { BROWSER_UA } from '@/lib/site';
import { YT } from '@/lib/snapshot';

export const revalidate = 60;

const HEADERS = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' };

export async function GET() {
  try {
    const r = await fetch(`https://www.youtube.com/channel/${YT.id}/live`, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'SOCS=CAI; CONSENT=YES+' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 60 },
    });
    if (!r.ok) throw new Error(String(r.status));
    const html = await r.text();
    const canon = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/);
    const live = !!canon && /"isLiveNow":true/.test(html);
    return Response.json({ live, id: live ? canon![1] : null }, { headers: HEADERS });
  } catch {
    return Response.json({ live: null, id: null }, { headers: { 'Cache-Control': 'public, s-maxage=20' } });
  }
}
