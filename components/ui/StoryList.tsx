import { fdate } from '@/lib/format';
import type { Story } from '@/lib/types';
import { StoryItem, kindAt } from './StoryItem';

/** Static paper story list (feature, rows, then cards), each linking out to woodwardsports.com. */
export function StoryList({ stories, id }: { stories: Story[]; id?: string }) {
  return (
    <ol className="stories" id={id} data-reveal="">
      {stories.map((s, k) => <StoryItem key={s.id} s={{ ...s, dateLabel: fdate(s.date) }} kind={kindAt(k)} eager={k === 0} />)}
    </ol>
  );
}
