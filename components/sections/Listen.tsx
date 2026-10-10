import { SectionHead } from '@/components/ui/SectionHead';
import { Ext, Icon } from '@/components/ui/bits';
import { SHOWS, showArt } from '@/lib/snapshot';
import { nw, slotShort } from '@/lib/format';
import type { Episode, Show } from '@/lib/types';

export function PodCard({ s, i, ep }: { s: Show; i: number; ep?: Episode }) {
  const art = showArt(s.id);
  return (
    <li className="pod" data-show={s.id} style={{ ['--i' as string]: i }}>
      <div className="pod__top">
        <img className="pod__art" src={art.sm} width={480} height={480} alt="" loading="lazy" decoding="async" />
        <div className="pod__id">
          <h3 className="pod__name">{s.podcast_name}</h3>
          <p className="pod__meta"><span className="nw">{slotShort(s)} ·</span> <span className="nw">MON–FRI</span></p>
        </div>
        <span className="eq" aria-hidden="true"><i /><i /><i /><i /></span>
      </div>
      {ep ? <p className="pod__ep"><span className="pod__lbl">Latest</span> <Ext href={ep.url}>{nw(ep.title)}</Ext></p> : null}
      <PodLinks s={s} />
    </li>
  );
}

export function PodLinks({ s }: { s: Show }) {
  return (
    <div className="pod__ctas">
      <Ext href={s.apple_podcasts} className="btn btn--blade btn--sm"><Icon name="pod" /><span>Apple Podcasts</span></Ext>
      {s.spotify ? <Ext href={s.spotify} className="btn btn--ghost btn--sm"><Icon name="spotify" /><span>Spotify</span></Ext> : null}
      <Ext href={s.rss} className="pod__rss"><Icon name="rss" /><span>RSS</span></Ext>
    </div>
  );
}

export function Listen({ latest, ch = '06' }: { latest: Record<string, Episode | undefined>; ch?: string }) {
  return (
    <section id="listen" className="sec sec--grad" aria-labelledby="listen-h">
      <div className="wrap">
        <SectionHead ch={ch} name="LISTEN" title="TURN IT UP." sub="Every show, every weekday, as a podcast. Missed the stream? Take it with you." id="listen-h" />
        <ul className="pods" data-reveal="">
          {SHOWS.map((s, i) => <PodCard key={s.id} s={s} i={i} ep={latest[s.id]} />)}
        </ul>
      </div>
    </section>
  );
}
