/* Is the channel streaming right now? Reads the channel's /live page: while a stream is on, YouTube points its
   canonical link at the video and marks the player "isLive" (older pages also carry "isLiveNow"). A scheduled stream
   that hasn't started has the same canonical link but "isUpcoming". The Live Room asks this before it loads the live
   player, so a late start or a day off shows the latest episode instead of a dead stream.
   { live: true, id } · { live: false } · { live: null } when YouTube can't be read (the player then tries anyway).
   ?fresh=1 ("Check for the stream") reads YouTube again after at most 10 s instead of 60 s. */
import { BROWSER_UA } from '@/lib/site';
import { YT } from '@/lib/snapshot';

export const dynamic = 'force-dynamic';

function liveFromHtml(html: string): { live: boolean; id: string | null } {
  const canon = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/);
  if (!canon) return { live: false, id: null };
  const upcoming = /"isUpcoming":true/.test(html);
  const live = !upcoming && /"isLive(?:Now)?":true/.test(html);
  return { live, id: live ? canon[1] : null };
}

export async function GET(req: Request) {
  const fresh = new URL(req.url).searchParams.has('fresh');
  try {
    const r = await fetch(`https://www.youtube.com/channel/${YT.id}/live`, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'SOCS=CAI; CONSENT=YES+' },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: fresh ? 10 : 60 },
    });
    if (!r.ok) throw new Error(String(r.status));
    const html = await r.text();
    if (new URL(req.url).searchParams.has('diag')) {
      /* temporary: what does YouTube serve to this server? (no secrets; removed after checking) */
      return Response.json({
        status: r.status, url: r.url, bytes: html.length, region: process.env.VERCEL_REGION ?? null,
        title: html.match(/<title>([^<]{0,120})/)?.[1] ?? null,
        canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null,
        isLive: /"isLive":true/.test(html), isLiveNow: /"isLiveNow":true/.test(html), upcoming: /"isUpcoming":true/.test(html),
        consent: /consent\.youtube|before you continue/i.test(html), bot: /confirm you.re not a bot|unusual traffic/i.test(html),
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return Response.json(liveFromHtml(html), {
      headers: { 'Cache-Control': fresh ? 'no-store' : 'public, s-maxage=30, stale-while-revalidate=30' },
    });
  } catch {
    return Response.json({ live: null, id: null }, { headers: { 'Cache-Control': 'public, s-maxage=15' } });
  }
}
