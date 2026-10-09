import { SectionHead } from '@/components/ui/SectionHead';
import { StoriesFilter } from '@/components/client/StoriesFilter';
import { TEAMS } from '@/lib/snapshot';
import { fdate } from '@/lib/format';
import type { Story } from '@/lib/types';
import type { StoryView } from '@/components/ui/StoryItem';

export const toView = (s: Story): StoryView => ({ ...s, dateLabel: fdate(s.date) });

export function Stories({ stories }: { stories: Story[] }) {
  const cats = Object.fromEntries(TEAMS.map(t => [t.id, t.category_url]));
  return (
    <section id="stories" className="sec sec--paper" aria-labelledby="stories-h">
      <div className="wrap">
        <SectionHead ch="04" name="STORIES" title="THE LATEST" sub="Breaking coverage, inside scoops and raw reactions from the Woodward newsroom. If it’s going down in the 313, it’s dropping here first." id="stories-h" />
      </div>
      <StoriesFilter items={stories.slice(0, 16).map(toView)} cats={cats} />
    </section>
  );
}
