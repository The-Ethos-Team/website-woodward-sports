import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { GA_ID, GTM_ID, INDEXING, OG_ALT, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site';
import { Analytics } from '@/components/client/Analytics';
import { BRAND, SOC, YT } from '@/lib/snapshot';
import { getStories } from '@/lib/data/wp';
import { getVideos } from '@/lib/data/youtube';
import { buildFindIndex, buildSchedule } from '@/lib/data/site';
import { Sprite } from '@/components/ui/bits';
import { Ticker } from '@/components/sections/Ticker';
import { Footer } from '@/components/sections/Footer';
import { Boot, LiveHtml, LiveProvider } from '@/components/client/Boot';
import { Ident } from '@/components/client/Ident';
import { Header } from '@/components/client/Header';
import { Dock } from '@/components/client/Dock';
import { LiveRoom } from '@/components/client/LiveRoom';
import { ShowSheet } from '@/components/client/ShowSheet';
import { Find } from '@/components/client/Find';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s — ${SITE_NAME}` },
  description: BRAND.description,
  applicationName: SITE_NAME,
  robots: { index: INDEXING, follow: true },
  openGraph: {
    type: 'website', siteName: SITE_NAME, title: SITE_TITLE, description: BRAND.description, url: '/',
    images: [{ url: '/img/og-image.jpg', width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: { card: 'summary_large_image', site: '@woodwardsports', title: SITE_TITLE, description: BRAND.description, images: ['/img/og-image.jpg'] },
  icons: {
    icon: [{ url: '/img/favicon.svg', type: 'image/svg+xml' }, { url: '/img/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: '/img/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050F18',
  colorScheme: 'dark light',
};

/* Runs before first paint: JS/motion classes for the CSS, the once-per-session ident, and a 5 s failsafe
   that shows everything statically if the app never boots. */
const BOOT = `!function(){var d=document.documentElement;d.className=d.className.replace('no-js','js v');try{var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;d.classList.add(rm?'rm':'a');if(!rm&&!location.hash&&!sessionStorage.getItem('wsn-ident'))d.classList.add('intro')}catch(x){}setTimeout(function(){if(!window.__wsn){d.classList.add('fs');d.classList.remove('intro','a','v')}},5000)}();`;

const LD = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Organization', name: BRAND.name,
  alternateName: ['Woodward Sports', 'WSN'], url: 'https://woodwardsports.com/',
  logo: SITE_URL + '/img/logo-512.png', description: BRAND.description,
  sameAs: [SOC.facebook, SOC.x, SOC.instagram, SOC.tiktok, SOC.youtube],
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [{ videos }, latest] = await Promise.all([getVideos(), getStories({ perPage: 20 })]);
  const schedule = buildSchedule(videos);
  const find = buildFindIndex(latest.items, videos);
  return (
    <html lang="en" className="no-js" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {GTM_ID ? (
          /* Google Tag Manager — as high in <head> as possible (inline on purpose, per Google's snippet) */
          // eslint-disable-next-line @next/next/next-script-for-ga
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        ) : null}
        {GA_ID ? (
          <>
            {/* Google tag (gtag.js) — GA4 */}
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`,
              }}
            />
          </>
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <link rel="preload" href="/fonts/anton-400.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/schibsted-grotesk-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LD }} />
      </head>
      <body>
        {GTM_ID ? (
          /* Google Tag Manager (noscript) — immediately after <body> */
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
          </noscript>
        ) : null}
        <a className="skip" href="#main">Skip to content</a>
        <Sprite />
        <LiveProvider schedule={schedule}>
          <Boot />
          <Ident />
          <Header liveUrl={YT.live_url} />
          <main id="main">
            <div className="tkbar"><Ticker stories={latest.items} /></div>
            {children}
          </main>
          <Footer />
          <Dock liveUrl={YT.live_url} />
          <LiveRoom />
          <ShowSheet />
          <Find index={find} shows={schedule.shows.map(s => ({ id: s.id, short: s.short }))} />
          <LiveHtml shows={schedule.shows} />
        </LiveProvider>
        {GTM_ID || GA_ID ? <Analytics /> : null}
      </body>
    </html>
  );
}
