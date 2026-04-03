'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { Logo } from '@/components/logo';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { LayoutDashboard, Settings, Layers, Users, User, Leaf, Rss } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { getAvatarUrl } from '@/lib/api/users';
import { Button } from '@/components/ui/button';
import type { AppLocale } from '@/i18n/routing';
import { trackEvent } from '@/lib/analytics';

export default function ProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Navigation');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const initialized = useAuthStore((state) => state.initialized);
  const isPublicProfilePage = pathname?.startsWith('/profile/') || pathname?.includes('/profile/');
  const showGuestLanguageSwitcher = isPublicProfilePage && !user;
  const logoHref = isPublicProfilePage && !user ? '/' : '/dashboard';

  useEffect(() => {
    if (!initialized) {
      fetchUser();
    }
  }, [fetchUser, initialized]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href={logoHref} className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors text-primary">
                  <Logo size="sm" />
                </div>

                <h3 className="text-xl font-bold">
                  <span className="text-primary">Plant</span>
                  <span className="text-foreground">Sheep</span>
                </h3>
              </Link>

              {user && (
                <nav className="hidden md:flex items-center gap-1">
                  {[
                    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), event: 'dashboard' },
                    { href: '/plants', icon: Leaf, label: t('myPlants'), event: 'plants' },
                    { href: '/shelves', icon: Layers, label: t('shelves'), event: 'shelves' },
                    { href: '/feed', icon: Rss, label: t('feed'), event: 'feed' },
                    { href: '/users', icon: Users, label: t('users'), event: 'users' },
                    ...(user.role === 'admin' ? [{ href: '/admin/info', icon: Settings, label: t('admin'), event: 'admin' }] : []),
                  ].map(({ href, icon: Icon, label, event }) => {
                    const normalizedPath = pathname?.replace(`/${locale}`, '') || '/';
                    const isActive = normalizedPath === href || normalizedPath?.startsWith(`${href}/`);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => trackEvent('nav_clicked', { item: event, device: 'desktop' })}
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                          isActive
                            ? 'font-semibold text-primary bg-primary/10'
                            : 'font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className={isActive ? '' : 'max-[1299px]:hidden'}>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {user && (
              <>
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <LanguageSwitcher locale={locale} />

                  <Link
                    href="/profile"
                    onClick={() => trackEvent('nav_clicked', { item: 'profile', device: 'desktop' })}
                    className="hidden lg:flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      {/* <p className="text-xs text-muted-foreground">{user.email}</p> */}
                    </div>
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                      {user.avatar ? (
                        <Image
                          src={getAvatarUrl(user.avatar)!}
                          alt={user.name}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => trackEvent('nav_clicked', { item: 'profile', device: 'mobile' })}
                    className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-primary/10 hover:opacity-80 transition-opacity shrink-0"
                  >
                    {user.avatar ? (
                      <Image
                        src={getAvatarUrl(user.avatar)!}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </Link>
                </div>
              </>
            )}

            {showGuestLanguageSwitcher && (
              <LanguageSwitcher locale={locale} />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-2 pb-24 md:pb-8">{children}</main>

      <footer className="w-full border-t border-border/30 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/40 mt-16 md:mb-0 mb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-20 items-center justify-center">
            <p className="text-base text-muted-foreground text-center">
              {t('help')}{' '}
              <br className="sm:hidden" />
              <a
                href="mailto:grushevskayyy7@gmail.com"
                className="font-medium text-primary hover:underline transition-all"
              >
                {t('helpEmail')}
              </a>
            </p>
          </div>
        </div>
      </footer>

      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-bottom">
          <div className="flex items-center justify-around px-2 pt-1 pb-2">
            {[
              { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), event: 'dashboard' },
              { href: '/plants', icon: Leaf, label: t('plants'), event: 'plants' },
              { href: '/feed', icon: Rss, label: t('feed'), event: 'feed' },
              { href: '/shelves', icon: Layers, label: t('shelves'), event: 'shelves' },
              { href: '/users', icon: Users, label: t('mobile.users'), event: 'users' },
            ].map(({ href, icon: Icon, label, event }) => {
              const normalizedPath = pathname?.replace(`/${locale}`, '') || '/';
              const isActive = normalizedPath === href || normalizedPath?.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => trackEvent('nav_clicked', { item: event, device: 'mobile' })}
                  className="flex select-none flex-col items-center gap-1 min-w-[4rem] py-1.5 transition-colors"
                >
                  <div
                    className={`relative flex items-center justify-center w-16 h-9 rounded-2xl transition-all duration-300 ease-in-out ${
                      isActive
                        ? 'bg-primary/15'
                        : 'bg-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-[1.4rem] h-[1.4rem] transition-all duration-300 ${
                        isActive ? 'text-primary stroke-[2.5]' : 'text-muted-foreground stroke-[1.75]'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[0.688rem] leading-tight select-none transition-colors duration-300 ${
                      isActive ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
