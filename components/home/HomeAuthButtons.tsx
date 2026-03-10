'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

type Variant = 'nav' | 'hero' | 'final';

export function HomeAuthButtons({ variant }: { variant: Variant }) {
  const user = useAuthStore((state) => state.user);

  if (variant === 'nav') {
    if (user) {
      return (
        <Button asChild size="sm">
          <Link href="/dashboard">Открыть панель</Link>
        </Button>
      );
    }
    return (
      <>
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Войти</Link>
        </Button>
        <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary/80 font-semibold">
          <Link href="/register">✨ Начать бесплатно</Link>
        </Button>
      </>
    );
  }

  if (user) {
    return (
      <Button asChild size="lg" className={variant === 'hero' ? 'px-10 gap-2' : 'px-12 gap-2'}>
        <Link href="/dashboard">
          Открыть панель <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <Button asChild size="lg" className="px-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary font-semibold">
          <Link href="/register">
            ✨ Начать бесплатно <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="px-10">
          <Link href="/login">Уже есть аккаунт</Link>
        </Button>
      </>
    );
  }

  // final variant
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button asChild size="lg" className="px-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary font-semibold">
        <Link href="/register">
          ✨ Создать аккаунт <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="px-12">
        <Link href="/login">Войти</Link>
      </Button>
    </div>
  );
}
