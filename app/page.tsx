'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="w-full max-w-2xl text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-primary/20 text-primary">
            <Logo size="lg" />
          </div>
        </div>

        {/* Hero Text */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            PlantSheep
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Отслеживайте и управляйте своей коллекцией растений с элегантной простотой
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="pt-8">
          {user ? (
            <Button asChild size="lg" className="px-12">
              <Link href="/dashboard">Открыть панель</Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-12">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-12">
                <Link href="/register">Начать</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-primary">Отслеживание роста</div>
            <p className="text-sm text-muted-foreground">
              Следите за развитием ваших растений с течением времени
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-primary">Организация</div>
            <p className="text-sm text-muted-foreground">
              Храните все данные о растениях в одном месте
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-primary">Безопасность</div>
            <p className="text-sm text-muted-foreground">
              Ваши данные защищены корпоративным уровнем безопасности
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
