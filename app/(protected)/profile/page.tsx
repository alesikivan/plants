'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, Calendar, Languages, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLanguageChange = async (language: string) => {
    setIsUpdating(true);
    try {
      await updateProfile({ preferredLanguage: language });
      toast.success('Язык успешно изменен');
    } catch (error) {
      toast.error('Ошибка при изменении языка');
      console.error('Failed to update language:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Вы успешно вышли из аккаунта');
    } catch (error) {
      toast.error('Ошибка при выходе из аккаунта');
      console.error('Failed to logout:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Профиль</h1>
        <p className="text-lg text-muted-foreground">
          Управляйте информацией вашего аккаунта и настройками
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl">{user.name}</CardTitle>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Information Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">Полное имя</span>
              </div>
              <p className="text-lg font-medium">{user.name}</p>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-semibold">Email адрес</span>
              </div>
              <p className="text-lg font-medium">{user.email}</p>
            </div>

            {/* Role */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-semibold">Роль аккаунта</span>
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-sm font-semibold text-primary capitalize">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-semibold">Участник с</span>
              </div>
              <p className="text-lg font-medium">
                {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Предпочтения</CardTitle>
            <CardDescription>
              Настройте ваш опыт использования приложения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Languages className="w-4 h-4" />
                <span className="text-sm font-semibold">Язык названий растений</span>
              </div>
              <Select
                value={user.preferredLanguage || 'ru'}
                onValueChange={handleLanguageChange}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите язык" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Выберите язык для отображения названий родов и сортов растений
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Выход из аккаунта</CardTitle>
            <CardDescription>
              Завершите текущий сеанс
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              className="w-full gap-2"
              variant="outline"
            >
              <LogOut className="w-4 h-4" />
              Выйти из аккаунта
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
