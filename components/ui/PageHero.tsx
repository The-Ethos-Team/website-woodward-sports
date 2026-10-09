import type { CSSProperties, ReactNode } from 'react';
import { Slashes } from './bits';

/** Inner-page top: the gradient band (the global ticker sits over it), kicker with slashes, Anton H1, lead, CTAs. */
export function PageHero({ kicker, title, dot = false, tag, sub, meta, ctas, art, team, aside }: {
  kicker: ReactNode; title: ReactNode; dot?: boolean; tag?: string; sub?: ReactNode; meta?: ReactNode; ctas?: ReactNode;
  art?: { src: string; srcSet?: string; alt: string }; team?: string; aside?: ReactNode;
}) {
  const cls = 'phero' + (art ? ' phero--art' : '') + (team ? ' phero--team' : '') + (aside ? ' phero--player' : '');
  const style: CSSProperties | undefined = team ? ({ ['--team' as string]: team } as CSSProperties) : undefined;
  return (
    <div className="top">
      <section className={cls} style={style} aria-labelledby="page-h">
        <div className="wrap phero__grid">
          <div className="phero__copy">
            <p className="hero__kicker kicker"><Slashes /><span className="hero__kick"><span>{kicker}</span></span></p>
            <h1 className="phero__h1" id="page-h">{title}{dot ? <span className="h1__dot">.</span> : null}</h1>
            {tag ? <p className="phero__tag">{tag}</p> : null}
            {sub ? <p className="phero__sub">{sub}</p> : null}
            {meta ? <div className="phero__meta">{meta}</div> : null}
            {ctas ? <div className="phero__ctas">{ctas}</div> : null}
          </div>
          {art ? (
            <div className="phero__art">
              <img src={art.src} srcSet={art.srcSet} sizes="(min-width: 768px) 420px, 180px" width={900} height={900} alt={art.alt} fetchPriority="high" decoding="async" />
            </div>
          ) : null}
          {aside ? <div className="phero__player">{aside}</div> : null}
        </div>
      </section>
    </div>
  );
}
