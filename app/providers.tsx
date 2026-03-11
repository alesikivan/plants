'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Toaster } from '@/components/ui/toaster';
import { stripLocaleFromPathname } from '@/lib/locale';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  const pathname = usePathname();
  const normalizedPathname = stripLocaleFromPathname(pathname);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const initialized = useAuthStore((state) => state.initialized);

  // Проверяем, находимся ли мы на страницах авторизации или публичных страницах
  const isAuthPage =
    normalizedPathname.startsWith('/login') || normalizedPathname.startsWith('/register');
  const isPublicPage =
    normalizedPathname.startsWith('/public') || normalizedPathname.startsWith('/profile/');

  useEffect(() => {
    // Не загружаем профиль на страницах авторизации и публичных страницах
    if (!initialized && !isAuthPage && !isPublicPage) {
      fetchUser();
    }
  }, [fetchUser, initialized, isAuthPage, isPublicPage]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      {children}
    </QueryClientProvider>
  );
}
