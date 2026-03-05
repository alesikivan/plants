'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/authStore';
import { Logo } from '@/components/logo';
import { LayoutDashboard, Settings, Layers, Users, User, Leaf } from 'lucide-react';
import { getAvatarUrl } from '@/lib/api/users';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const initialized = useAuthStore((state) => state.initialized);

  // Загружаем профиль при входе на защищенные страницы
  useEffect(() => {
    if (!initialized) {
      fetchUser();
    }
  }, [fetchUser, initialized]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Nav */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 group">
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
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Панель
                  </Link>
                  <Link
                    href="/plants"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Leaf className="w-4 h-4" />
                    Мои растения
                  </Link>
                  <Link
                    href="/shelves"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Layers className="w-4 h-4" />
                    Полки
                  </Link>
                  <Link
                    href="/users"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Пользователи
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Админ
                    </Link>
                  )}
                </nav>
              )}
            </div>

            {/* User Menu */}
            {user && (
              <>
                {/* Desktop User Info */}
                <Link
                  href="/profile"
                  className="hidden lg:flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
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

                {/* Mobile User Icon */}
                <Link
                  href="/profile"
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/30 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/40 mt-16 md:mb-0 mb-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-20 items-center justify-center">
            <p className="text-base text-muted-foreground text-center">
              Нужна помощь или есть предложение?{' '}
              <br className='sm:hidden' />
              <a
                href="mailto:grushevskayyy7@gmail.com"
                className="font-medium text-primary hover:underline transition-all"
              >
                Напишите нам – мы всё читаем :)
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-around px-4 py-2">
            <Link
              href="/dashboard"
              className="flex select-none flex-col items-center gap-1 px-3 py-2 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-xs font-medium select-none">Панель</span>
            </Link>
            <Link
              href="/plants"
              className="flex select-none flex-col items-center gap-1 px-3 py-2 transition-colors"
            >
              <Leaf className="w-5 h-5" />
              <span className="text-xs font-medium select-none">Растения</span>
            </Link>
            <Link
              href="/shelves"
              className="flex select-none flex-col items-center gap-1 px-3 py-2 transition-colors"
            >
              <Layers className="w-5 h-5" />
              <span className="text-xs font-medium select-none">Полки</span>
            </Link>
            <Link
              href="/users"
              className="flex select-none flex-col items-center gap-1 px-3 py-2 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs font-medium select-none">Польз.</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
