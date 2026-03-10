import {defaultLocale, locales, type AppLocale} from '@/i18n/routing';

export function isLocale(value: string | null | undefined): value is AppLocale {
  return !!value && locales.includes(value as AppLocale);
}

export function getPathnameLocale(pathname: string): AppLocale | null {
  const [, maybeLocale] = pathname.split('/');
  return isLocale(maybeLocale) ? maybeLocale : null;
}

export function stripLocaleFromPathname(pathname: string | null | undefined) {
  if (!pathname) {
    return '/';
  }

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return '/';
  }

  if (!isLocale(segments[0])) {
    return pathname;
  }

  const stripped = `/${segments.slice(1).join('/')}`;
  return stripped === '/' ? '/' : stripped;
}

export function detectPreferredLocale(acceptLanguage: string | null) {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  for (const entry of acceptLanguage.split(',')) {
    const language = entry.split(';')[0]?.trim().toLowerCase();

    if (language === 'ru' || language?.startsWith('ru-')) {
      return 'ru' satisfies AppLocale;
    }

    if (language === 'en' || language?.startsWith('en-')) {
      return 'en' satisfies AppLocale;
    }
  }

  return defaultLocale;
}

export function localizeHref(pathname: string, locale: AppLocale) {
  if (locale === defaultLocale) {
    return pathname;
  }

  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
}
