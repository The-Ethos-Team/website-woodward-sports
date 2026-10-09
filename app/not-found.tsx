import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Off air', robots: { index: false, follow: true } };

/** Branded 404: "Off air." */
export default function NotFound() {
  return (
    <div className="top">
      <section className="off" aria-labelledby="off-h">
        <div className="wrap">
          <img className="off__logo" src="/img/logo.svg" width={120} height={120} alt="Woodward Sports Network" />
          <span className="off__k lbl">CH 404 — OFF AIR</span>
          <h1 className="off__h" id="off-h">Off air<span className="h1__dot">.</span></h1>
          <p className="off__p">This page isn’t on the lineup. The shows are still live every weekday, <span className="nw">8AM–7PM ET.</span></p>
          <nav className="off__nav" aria-label="Back to the network">
            <Link className="btn btn--blade btn--xl" href="/">Back to WSN</Link>
            <Link className="btn btn--ghost" href="/shows">The lineup</Link>
            <Link className="btn btn--ghost" href="/stories">Latest stories</Link>
          </nav>
        </div>
      </section>
    </div>
  );
}
