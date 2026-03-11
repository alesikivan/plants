import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

const APP_DESCRIPTION =
  'Ведите цифровой дневник своей коллекции растений. Отслеживайте историю, организуйте по полкам и делитесь с сообществом — всё в одном месте.';

const APP_TITLE = 'PlantSheep — трекер коллекции растений';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_TITLE,
    template: '%s — PlantSheep',
  },
  description: APP_DESCRIPTION,
  keywords: [
    'растения',
    'коллекция растений',
    'трекер растений',
    'дневник растений',
    'уход за растениями',
    'история растений',
    'комнатные растения',
    'растениевод',
    'домашние растения',
    'цифровой дневник',
    'организация растений',
    'планировщик растений',
    'plantsheep',
  ],
  authors: [{ name: 'PlantSheep', url: APP_URL }],
  creator: 'grumarg',
  publisher: 'PlantSheep',
  category: 'Lifestyle',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    alternateLocale: ['en_US'],
    url: APP_URL,
    siteName: 'PlantSheep',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [
      {
        url: '/og-image-1200.png',
        width: 1200,
        height: 630,
        alt: APP_TITLE,
        type: 'image/png',
      },
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'PlantSheep Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@plantsheep',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ['/og-image-1200.png'],
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      ru: `${APP_URL}/ru`,
      en: `${APP_URL}/en`,
    },
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    maximumScale: 5,
    userScalable: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PlantSheep',
    startupImage: '/apple-touch-icon.png',
  },
  icons: {
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  appLinks: {
    ios: {
      url: 'plantsheep://app',
      app_store_id: '123456789',
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${APP_URL}/#webapp`,
      name: 'PlantSheep',
      url: APP_URL,
      applicationUrl: APP_URL,
      description: APP_DESCRIPTION,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      inLanguage: ['ru', 'en'],
      isAccessibleForFree: true,
      storageRequirements: 'https://schema.org/Cloud',
      screenshot: {
        '@type': 'ImageObject',
        url: `${APP_URL}/screenshot-1.png`,
        width: 1200,
        height: 630,
      },
      offers: [
        {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5',
        ratingCount: '100',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: 'PlantSheep',
      url: APP_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_URL}/icon-512x512.png`,
        width: 512,
        height: 512,
      },
      description: APP_DESCRIPTION,
      sameAs: [
        'https://twitter.com/plantsheep',
        'https://instagram.com/plantsheep',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Support',
        availableLanguage: ['ru', 'en'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'PlantSheep',
      description: APP_DESCRIPTION,
      inLanguage: ['ru', 'en'],
      isPartOf: { '@id': `${APP_URL}/#organization` },
      publisher: { '@id': `${APP_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${APP_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${APP_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Что такое PlantSheep?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: APP_DESCRIPTION,
          },
        },
        {
          '@type': 'Question',
          name: 'PlantSheep бесплатное?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, PlantSheep полностью бесплатное приложение для управления коллекцией растений.',
          },
        },
      ],
    },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = (await headers()).get('x-next-intl-locale') || 'en';

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-D5YTGTTGEX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-D5YTGTTGEX');
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
