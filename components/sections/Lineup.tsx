import { SectionHead } from '@/components/ui/SectionHead';
import { DayRail } from '@/components/client/DayRail';
import { DATA } from '@/lib/snapshot';

export function Lineup({ mode = 'sheet', ch = '02', as = 'h2' }: { mode?: 'sheet' | 'link'; ch?: string; as?: 'h1' | 'h2' }) {
  return (
    <section id="lineup" className="sec sec--ink" aria-labelledby="lineup-h">
      <div className="wrap">
        <SectionHead ch={ch} name="LINEUP" title="THE LINEUP" sub="Every take. Every host. All the noise." id="lineup-h" as={as} />
        <DayRail gaps={DATA.schedule.gaps_in_day} mode={mode} />
      </div>
    </section>
  );
}
