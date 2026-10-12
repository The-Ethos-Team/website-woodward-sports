import { PageHero } from '@/components/ui/PageHero';
import { SectionHead } from '@/components/ui/SectionHead';
import { Arrow, Ext } from '@/components/ui/bits';
import { getPrivacyPage } from '@/lib/data/wp';
import { fdate } from '@/lib/format';
import { pageMeta } from '@/lib/meta';
import { GA_ID, GTM_ID } from '@/lib/site';
import { DATA } from '@/lib/snapshot';

export const metadata = pageMeta({
  title: 'Privacy',
  description: 'Privacy at Woodward Sports Network: what this site loads and measures, and the full privacy policy on woodwardsports.com.',
  path: '/privacy',
});

export default async function PrivacyPage() {
  const wp = await getPrivacyPage();
  const url = wp?.link ?? DATA.privacy_policy_url;
  const analytics = !!(GA_ID || GTM_ID);
  return (
    <>
      <PageHero kicker="THE FINE PRINT" title="Privacy" dot sub="What this site loads and measures, and the full policy on woodwardsports.com." />
      <section className="sec sec--paper" aria-labelledby="pv-h">
        <div className="wrap">
          <SectionHead ch="01" name="PRIVACY" title="THE SHORT VERSION" id="pv-h" />
          <div className="prose">
            <p>Woodward Sports Network’s full privacy policy lives on woodwardsports.com. It covers the site, comments, cookies and embedded content. Here is what this site does.</p>
            <h2>What we measure</h2>
            {analytics ? (
              <ul>
                <li>We use <b>Google Analytics 4</b>{GTM_ID ? <>, loaded alongside <b>Google Tag Manager</b>,</> : null} to count visits and see which pages, shows and links people use, so we can make the network better and show sponsors how many fans see their placements.</li>
                <li>Google Analytics sets first-party cookies (<code>_ga</code> and <code>_ga_…</code>) that tell visits apart. They hold a random ID, not your name or email. Google processes this data under its own privacy policy.</li>
                <li>We record clicks on the main buttons and links: Watch, Listen, Shop, the app, socials, stories and sponsor slots, plus when a sponsor slot is seen. We never record what you type.</li>
                <li>To opt out, block cookies for this site in your browser or install Google’s <Ext href="https://tools.google.com/dlpage/gaoptout">Analytics opt-out add-on</Ext>.</li>
              </ul>
            ) : (
              <ul><li>This site doesn’t run analytics or ad tracking.</li></ul>
            )}
            <h2>Everything else</h2>
            <ul>
              <li>No sign-up and no forms. The site stores one flag in your browser’s session storage so the network intro plays once per visit.</li>
              <li>The YouTube player loads only when you press play. Replays use YouTube’s privacy-enhanced mode (youtube-nocookie.com); the live stream plays from youtube.com.</li>
              <li>Stories, podcasts, the shop and the app open on woodwardsports.com, Spreaker, Apple Podcasts, Spotify, the Woodward Sports Store and the App Store. Their own policies apply there.</li>
            </ul>
            <div className="sec__foot">
              <Ext href={url} className="btn btn--ink"><span>Full privacy policy</span><Arrow /></Ext>
              <Ext href="https://policies.google.com/privacy" className="textlink"><span>Google’s privacy policy</span><Arrow /></Ext>
            </div>
            {wp?.modified ? <p className="smallprint">{wp.title ?? 'Privacy Policy'} on woodwardsports.com, last updated {fdate(wp.modified)}.</p> : null}
          </div>
        </div>
      </section>
    </>
  );
}
