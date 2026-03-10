import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

const APP_DESCRIPTION =
  'Ведите цифровой дневник своей коллекции растений. Отслеживайте историю, организуйте по полкам и делитесь с сообществом — всё в одном месте.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'PlantSheep — трекер коллекции растений',
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
    'plantsheep',
  ],
  authors: [{ name: 'PlantSheep', url: APP_URL }],
  creator: 'PlantSheep',
  publisher: 'PlantSheep',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: APP_URL,
    siteName: 'PlantSheep',
    title: 'PlantSheep — трекер коллекции растений',
    description: APP_DESCRIPTION,
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'PlantSheep — трекер коллекции растений',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'PlantSheep — трекер коллекции растений',
    description: APP_DESCRIPTION,
    images: ['/icon-512x512.png'],
  },
  alternates: {
    canonical: APP_URL,
  },
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PlantSheep',
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
    ],
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
      description: APP_DESCRIPTION,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      inLanguage: 'ru',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'RUB',
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
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'PlantSheep',
      inLanguage: 'ru',
      publisher: { '@id': `${APP_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
