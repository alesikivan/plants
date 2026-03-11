import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {APP_NAME, APP_URL, getAlternateLocales, getLanguageAlternates, getLocalizedAppTitle, getOpenGraphLocale, getSeoContent, getSeoJsonLd} from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const seo = getSeoContent(locale);
  const title = getLocalizedAppTitle(locale);
  const localePath = `${APP_URL}/${locale}`;

  return {
    title: {
      default: title,
      template: `%s | ${APP_NAME}`,
    },
    description: seo.description,
    keywords: seo.keywords,
    category: seo.category,
    openGraph: {
      type: 'website',
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateLocales(locale),
      url: localePath,
      siteName: APP_NAME,
      title,
      description: seo.description,
      images: [
        {
          url: '/og-image-1200.png',
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
        {
          url: '/icon-512x512.png',
          width: 512,
          height: 512,
          alt: `${APP_NAME} logo`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@plantsheep',
      title,
      description: seo.description,
      images: ['/og-image-1200.png'],
    },
    alternates: {
      canonical: localePath,
      languages: getLanguageAlternates(),
    },
    appleWebApp: {
      title,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const jsonLd = getSeoJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
    </>
  );
}
