'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import type { AppLocale } from '@/i18n/routing';

export function PublicHeader() {
  const t = useTranslations('PublicHeader');
  const locale = useLocale() as AppLocale;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors text-primary">
              <Logo size="sm" />
            </div>

            <h3 className="text-xl font-bold">
              <span className="text-primary">Plant</span>
              <span className="text-foreground">Sheep</span>
            </h3>
          </Link>

          {/* Language Selector & Sign Up Button */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} />

            {/* <Link href="/register" className='cursor-pointer'>
              <Button size="sm" className="px-4 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary font-semibold">
                {t('startFree')}
              </Button>
            </Link> */}
          </div>
        </div>
      </div>
    </header>
  );
}
