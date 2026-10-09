import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext } from '@/components/ui/bits';
import { getPrivacyPage } from '@/lib/data/wp';
import { fdate } from '@/lib/format';
import { pageMeta } from '@/lib/meta';
import { DATA } from '@/lib/snapshot';

export const metadata = pageMeta({
  title: 'Privacy',
  description: 'Privacy at Woodward Sports Network: what this site loads, and the full privacy policy on woodwardsports.com.',
  path: '/privacy',
});

export default async function PrivacyPage() {
  const wp = await getPrivacyPage();
  const url = wp?.link ?? DATA.privacy_policy_url;
  return (
    <>
      <PageHero kicker="THE FINE PRINT" title="Privacy" dot sub="The short version for this site, and the full policy on woodwardsports.com." />
      <section className="sec sec--paper" aria-labelledby="pv-h">
        <div className="wrap">
          <SectionHead ch="01" name="PRIVACY" title="THE SHORT VERSION" id="pv-h" />
          <div className="prose">
            <p>Woodward Sports Network’s privacy policy lives on woodwardsports.com. It covers the site, comments, cookies and embedded content.</p>
            <ul>
              <li>This site has no sign-up, no forms and no ads tracking. It stores one flag in your browser’s session storage, so the network intro plays once per visit.</li>
              <li>The YouTube player loads only when you press play. Replays use YouTube’s privacy-enhanced mode (youtube-nocookie.com).</li>
              <li>Stories, podcasts, the shop and the app open on woodwardsports.com, Spreaker, Apple Podcasts, Spotify, the Woodward Sports Store and the App Store. Their own policies apply there.</li>
            </ul>
            <div className="sec__foot">
              <Ext href={url} className="btn btn--ink"><span>{wp?.title ?? 'Privacy Policy'} on woodwardsports.com</span><Arrow /></Ext>
            </div>
            {wp?.modified ? <p className="smallprint">Policy last updated on woodwardsports.com: {fdate(wp.modified)}.</p> : null}
          </div>
        </div>
      </section>
    </>
  );
}
