import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Bungee } from 'next/font/google';
import Link from 'next/link';
import { headers } from 'next/headers';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CollegeProvider } from '@/components/CollegeProvider';
import { CollegePicker } from '@/components/CollegePicker';
import { Navbar } from '@/components/Navbar';
import { FooterBrand } from '@/components/FooterBrand';
import { NewFeatureAnnouncement } from '@/components/NewFeatureAnnouncement';
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const bungee = Bungee({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bungee',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Result Hub DTU & NSUT — DTU, NSUT & Delhi Results, Analytics & Leaderboards',
    template: '%s | Result Hub DTU & NSUT',
  },
  description:
    'Result Hub (ResultHub) is the #1 student-built platform for DTU, NSUT & Delhi colleges. Check DTU & NSUT results, SGPA leaderboards, semester analytics, subject difficulty, compare students, academic twins, semester wrapped & more. Result Hub DTU · Result Hub NSUT · ResultHubDelhi.',
  keywords: [
    'result hub',
    'resulthub',
    'result hub dtu',
    'result hub nsut',
    'result hub delhi',
    'ResultHubNSUT',
    'ResultHubDelhi',
    'ResultHubDTU',
    'resulthubnust',
    'resulthubdelhi',
    'resulthubdtu',
    'resulthub nsut',
    'resulthub dtu',
    'resulthub delhi',
    'DTU result hub',
    'NSUT results',
    'DTU results',
    'NSUT leaderboard',
    'DTU leaderboard',
    'NSUT SGPA',
    'DTU SGPA',
    'NSUT analytics',
    'NSUT marks',
    'DTU marks',
    'NSUT semester wrapped',
    'DTU semester wrapped',
    'NSUT subject difficulty',
    'Delhi university results',
    'NSUT result checker',
    'DTU result checker',
    'NSUT CGPA calculator',
    'DTU CGPA calculator',
    'NSUT academic performance',
    'DTU academic performance',
    'NSUT student portal',
    'DTU student portal',
    'IGDTUW results',
    'IGDTUW leaderboard',
    'Delhi college results',
    'compare NSUT students',
    'compare DTU students',
    'NSUT branch wise results',
    'DTU branch wise results',
  ],
  authors: [
    { name: 'Aryan Anand' },
    { name: 'Sujal Chaudhary' },
  ],
  creator: 'ResultHubNSUT',
  publisher: 'ResultHubNSUT',
  metadataBase: new URL('https://www.resulthubnsut.com'),
  alternates: {
    canonical: 'https://www.resulthubnsut.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.resulthubnsut.com',
    siteName: 'Result Hub — DTU, NSUT & Delhi Results',
    title: 'Result Hub DTU & NSUT — DTU, NSUT & Delhi Results & Analytics',
    description:
      'Result Hub — the #1 student-built platform for DTU, NSUT & Delhi colleges. SGPA leaderboards, semester analytics, subject difficulty, compare students, academic twins, wrapped & more.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ResultHubNSUT — NSUT, DTU & Delhi Results Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Result Hub DTU & NSUT — DTU, NSUT & Delhi Results & Analytics',
    description:
      'Result Hub — the #1 student-built platform for DTU, NSUT & Delhi colleges. Leaderboards, analytics, compare, wrapped & more.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|bingpreview|linkedinbot|twitterbot|whatsapp|telegrambot|googlebot|yandex|baiduspider|duckduckbot/i;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isBot = BOT_PATTERN.test(userAgent);

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${bungee.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Result Hub',
              alternateName: ['ResultHub', 'Result Hub DTU', 'Result Hub NSUT', 'Result Hub Delhi', 'ResultHubNSUT', 'ResultHubDTU', 'ResultHubDelhi', 'resulthubnust', 'resulthubdelhi', 'resulthubdtu'],
              url: 'https://www.resulthubnsut.com',
              description: 'Result Hub — the #1 student-built academic platform for DTU, NSUT & Delhi colleges. Check DTU & NSUT results, SGPA leaderboards, semester analytics, subject difficulty, compare students, academic twins & more.',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
              author: [
                { '@type': 'Person', name: 'Aryan Anand' },
                { '@type': 'Person', name: 'Sujal Chaudhary' },
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '500',
                bestRating: '5',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Result Hub',
              alternateName: ['ResultHub', 'Result Hub DTU', 'Result Hub NSUT'],
              url: 'https://www.resulthubnsut.com',
              logo: 'https://www.resulthubnsut.com/og-image.png',
              sameAs: ['https://github.com/sujallchaudhary/Resulthubfrontend'],
            }),
          }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
        <ThemeProvider>
          <CollegeProvider isBot={isBot}>
          <CollegePicker />
          <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: 'var(--background)' }}>

            {/* ── Navigation ── */}
            <Navbar />

            {/* ── Main content ── */}
            <main className="flex-1">
              {children}
            </main>

            {/* ── Footer ── */}
            <footer className="border-t py-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                <FooterBrand />
                <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Link href="/dtu" className="hover:underline">Result Hub DTU</Link>
                  <Link href="/analytics" className="hover:underline">Analytics</Link>
                  <Link href="/subjects" className="hover:underline">Subjects</Link>
                  <Link href="/wrapped" className="hover:underline">Wrapped</Link>
                </div>
              </div>
            </footer>
          </div>
          <NewFeatureAnnouncement />
          </CollegeProvider>
        </ThemeProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
    </html>
  );
}
