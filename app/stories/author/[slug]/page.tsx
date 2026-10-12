import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext } from '@/components/ui/bits';
import { StoryList } from '@/components/ui/StoryList';
import { getWriterStories, getWriters } from '@/lib/data/wp';
import { pageMeta } from '@/lib/meta';

/** a feature, 4 rows and 6 cards: full rows of 3 on desktop (same as /stories) */
const PER = 11;
type SP = Promise<{ page?: string | string[] }>;
const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
const writerOf = (slug: string) => getWriters().find(w => w.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const w = writerOf((await params).slug);
  if (!w) return {};
  return pageMeta({
    title: `${w.name}${w.name === 'Woodward Sports' ? ' staff' : ''} stories`,
    description: `Stories by ${w.name}${w.role ? `, ${w.role}` : ''}, for Woodward Sports Network. Every story opens on woodwardsports.com.`,
    path: `/stories/author/${w.slug}`,
  });
}

export default async function WriterPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: SP }) {
  const w = writerOf((await params).slug);
  if (!w) notFound();
  const page = Math.max(1, parseInt(one((await searchParams).page) ?? '1', 10) || 1);
  const res = await getWriterStories(w, { perPage: PER, page });
  if (page > res.pages) notFound();
  const others = getWriters().filter(x => x.slug !== w.slug);
  const href = (p: number) => `/stories/author/${w.slug}${p > 1 ? `?page=${p}` : ''}`;
  return (
    <>
      <PageHero
        kicker={w.role ? w.role.toUpperCase() : w.name === 'Woodward Sports' ? 'STAFF · THE NEWSROOM' : 'WRITER'}
        title={w.name}
        sub={w.name === 'Woodward Sports' ? 'Newsroom and staff stories from Woodward Sports Network.' : `Stories by ${w.name} for Woodward Sports Network.`}
        meta={<span>{res.total} {res.total === 1 ? 'story' : 'stories'} on woodwardsports.com</span>}
        ctas={w.authorUrl ? <Ext href={w.authorUrl} className="btn btn--ghost"><span>Writer page on woodwardsports.com</span></Ext> : undefined}
      />
      <section className="sec sec--paper" aria-labelledby="ws-h">
        <div className="wrap">
          <SectionHead ch="01" name="STORIES" title={page > 1 ? `PAGE ${page}` : 'THE LATEST'} id="ws-h" />
          {res.items.length ? <StoryList stories={res.items} /> : <p className="stories__empty">No recent stories found. <Ext href="https://woodwardsports.com/news/">See all coverage on woodwardsports.com<Arrow /></Ext></p>}
          {res.pages > 1 ? (
            <nav className="pager" aria-label="Pages">
              {page > 1 ? <Link className="btn btn--ink" href={href(page - 1)}>Newer</Link> : <span className="btn btn--ink" aria-disabled="true">Newer</span>}
              <span className="pager__n">Page {page} of {res.pages}</span>
              {page < res.pages ? <Link className="btn btn--ink" href={href(page + 1)}>Older</Link> : <span className="btn btn--ink" aria-disabled="true">Older</span>}
            </nav>
          ) : null}
          <div className="sec__foot"><Link className="textlink" href="/stories"><span>All stories</span><Arrow /></Link></div>
          <p className="lchips__lbl lbl" id="writers-lbl">More writers</p>
          <ul className="lchips" aria-labelledby="writers-lbl">
            {others.map(o => <li key={o.slug}><Link className="lchip" href={`/stories/author/${o.slug}`}>{o.name}</Link></li>)}
          </ul>
        </div>
      </section>
    </>
  );
}
