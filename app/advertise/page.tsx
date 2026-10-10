import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Icon } from '@/components/ui/bits';
import { Advertise } from '@/components/sections/Advertise';
import { CONTACT } from '@/lib/config';
import { pageMeta } from '@/lib/meta';
import Link from 'next/link';

export const metadata = pageMeta({
  title: 'Advertise',
  description: 'Your brand. On air. Presenting sponsorships, live reads, lower-thirds, podcast ads, watch-party activations and more with Woodward Sports Network, live every weekday.',
  path: '/advertise',
});

const SLOTS: [string, string, string][] = [
  ['Live Room presented by', 'The player that follows fans around the site', '/watch'],
  ['Show presented by', 'Your name on a show: open, bug and lower-thirds', '/shows'],
  ['Team hub presented by', 'Own the Lions, Pistons, Tigers or Red Wings page', '/teams'],
  ['Watch party presenting partner', 'Put your bar or brand on the next one', '/watch-parties'],
];

export default function AdvertisePage() {
  return (
    <>
      <PageHero
        kicker="PARTNER WITH WSN"
        title="Advertise" dot
        sub="Sponsorships, live reads, podcast ads and watch-party activations with Detroit’s unfiltered sports network."
        ctas={<>
          <a className="btn btn--blade btn--xl" href={CONTACT.primary} target="_blank" rel="noopener" data-contact="" data-placement="advertise_hero"><Icon name="chat" /><span>Advertise with WSN</span><span className="sr-only"> (opens Instagram in a new tab)</span></a>
          <a className="textlink textlink--light" href={CONTACT.alt} target="_blank" rel="noopener" data-contact="" data-placement="advertise_hero">Prefer Messenger?<Arrow /><span className="sr-only"> (opens in new tab)</span></a>
        </>}
      />
      <Advertise ch="01" />
      <section className="sec sec--ink2" aria-labelledby="slots-h">
        <div className="wrap">
          <SectionHead ch="02" name="ON THIS SITE" title="OPEN SLOTS" sub="Every sponsor slot on the new site is open right now." id="slots-h" />
          <ul className="slots" data-reveal="">
            {SLOTS.map(([k, cta, href], i) => (
              <li key={k} style={{ ['--i' as string]: i }}>
                <Link className="slot" href={href} data-slot={`advertise_list:${k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`}><span className="slot__k">{k}</span><span className="slot__v">Available</span><span className="slot__cta">{cta}<Arrow /></span></Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
