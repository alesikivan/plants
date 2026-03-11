import {defaultLocale, routing} from '@/i18n/routing';

export const APP_NAME = 'PlantSheep';
export const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

type SeoFaqEntry = {
  question: string;
  answer: string;
};

export type SeoContent = {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  faq: SeoFaqEntry[];
};

const seoByLocale: Record<string, SeoContent> = {
  en: {
    title: 'PlantSheep, plant collection tracker',
    description:
      'Keep a digital journal of your plant collection. Track history, organize shelves, and share plants with the community in one place.',
    keywords: [
      'plants',
      'plant collection',
      'plant tracker',
      'plant journal',
      'plant care',
      'houseplants',
      'plant history',
      'indoor plants',
      'collection management',
      APP_NAME.toLowerCase(),
    ],
    category: 'Lifestyle',
    faq: [
      {
        question: `What is ${APP_NAME}?`,
        answer:
          'PlantSheep is a web app for managing plant collections, tracking plant history, organizing shelves, and sharing plants with others.',
      },
      {
        question: `Is ${APP_NAME} free?`,
        answer: `${APP_NAME} is free to use for managing your plant collection.`,
      },
    ],
  },
  ru: {
    title: 'PlantSheep, трекер коллекции растений',
    description:
      'Ведите цифровой дневник своей коллекции растений. Отслеживайте историю, организуйте по полкам и делитесь с сообществом в одном месте.',
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
      'организация растений',
      APP_NAME.toLowerCase(),
    ],
    category: 'Lifestyle',
    faq: [
      {
        question: `Что такое ${APP_NAME}?`,
        answer:
          'PlantSheep это веб-приложение для управления коллекцией растений, ведения истории, организации полок и обмена растениями с другими пользователями.',
      },
      {
        question: `${APP_NAME} бесплатное?`,
        answer: `${APP_NAME} можно использовать бесплатно для управления коллекцией растений.`,
      },
    ],
  },
};

function getFallbackSeoContent(): SeoContent {
  return seoByLocale[defaultLocale] || Object.values(seoByLocale)[0];
}

export function getSeoContent(locale: string): SeoContent {
  return seoByLocale[locale] || getFallbackSeoContent();
}

export function getLocalizedAppTitle(locale: string) {
  return getSeoContent(locale).title;
}

export function getOpenGraphLocale(locale: string) {
  try {
    const normalized = new Intl.Locale(locale).maximize();
    const language = normalized.language;
    const region = normalized.region || language.toUpperCase();
    return `${language}_${region}`;
  } catch {
    return locale.replace('-', '_');
  }
}

export function getAlternateLocales(currentLocale: string) {
  return routing.locales
    .filter((locale) => locale !== currentLocale)
    .map((locale) => getOpenGraphLocale(locale));
}

export function getLanguageAlternates() {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, `${APP_URL}/${locale}`])
  );
}

export function getSeoJsonLd(locale: string) {
  const seo = getSeoContent(locale);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${APP_URL}/#webapp`,
        name: APP_NAME,
        url: APP_URL,
        applicationUrl: APP_URL,
        description: seo.description,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        inLanguage: routing.locales,
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
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        ],
      },
      {
        '@type': 'Organization',
        '@id': `${APP_URL}/#organization`,
        name: APP_NAME,
        url: APP_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${APP_URL}/icon-512x512.png`,
          width: 512,
          height: 512,
        },
        description: seo.description,
      },
      {
        '@type': 'WebSite',
        '@id': `${APP_URL}/#website`,
        url: APP_URL,
        name: APP_NAME,
        description: seo.description,
        inLanguage: routing.locales,
        isPartOf: {'@id': `${APP_URL}/#organization`},
        publisher: {'@id': `${APP_URL}/#organization`},
      },
      {
        '@type': 'FAQPage',
        '@id': `${APP_URL}/#faq`,
        inLanguage: locale,
        mainEntity: seo.faq.map((entry) => ({
          '@type': 'Question',
          name: entry.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: entry.answer,
          },
        })),
      },
    ],
  };
}
