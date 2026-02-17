'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, TrendingUp, ShieldCheck, User } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  return (
    <div className="space-y-4 mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Quick Actions */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <h2 className="text-2xl font-bold mb-4">Быстрые действия</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => router.push('/plants')}
            className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left group hover:scale-105 active:scale-95"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Добавить растение</h3>
              <p className="text-sm text-muted-foreground">Начните отслеживать новое растение</p>
            </div>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: '100ms' }}>
        {/* Profile Card */}
        <Card className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: '150ms' }}>
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Ваш профиль</CardTitle>
              <CardDescription>Управление настройками аккаунта</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Роль</span>
              <span className="text-sm font-medium capitalize">{user?.role}</span>
            </div>
          </CardContent>
        </Card>

        {/* Plants Card */}
        <Card className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: '200ms' }}>
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Мои растения</CardTitle>
              <CardDescription>Отслеживайте свою коллекцию</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <p className="text-sm">Скоро...</p>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card className="animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: '250ms' }}>
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Статистика</CardTitle>
              <CardDescription>Просмотр вашей активности</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              <p className="text-sm">Скоро...</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Banner */}
      {/* <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <CardTitle className="text-lg">Аутентификация активна</CardTitle>
              <CardDescription className="text-base">
                Вы успешно аутентифицированы с защищенными httpOnly куками. Ваши токены защищены и недоступны из JavaScript, обеспечивая максимальную безопасность вашего аккаунта.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card> */}

    </div>
  );
}
