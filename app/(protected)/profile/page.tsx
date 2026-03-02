'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, Calendar, Languages, LogOut, Leaf, Layers, Eye, EyeOff, ChevronRight, Lock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { plantsApi, shelvesApi, Plant, Shelf } from '@/lib/api';
import { PlantCard } from '@/components/plants/PlantCard';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import Link from 'next/link';

const DESKTOP_PREVIEW = 5;
const MOBILE_PREVIEW = 3;

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
  const [isUpdating, setIsUpdating] = useState(false);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [loadingShelves, setLoadingShelves] = useState(true);

  useEffect(() => {
    plantsApi.getAll().then(setPlants).catch(() => {}).finally(() => setLoadingPlants(false));
    shelvesApi.getAll().then(setShelves).catch(() => {}).finally(() => setLoadingShelves(false));
  }, []);

  const handleLanguageChange = async (language: string) => {
    setIsUpdating(true);
    try {
      await updateProfile({ preferredLanguage: language });
      toast.success('Язык успешно изменен');
    } catch (error) {
      toast.error('Ошибка при изменении языка');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrivacyChange = async (field: 'showPlants' | 'showShelves' | 'showPlantHistory', value: boolean) => {
    try {
      await updateProfile({ [field]: value });
      toast.success('Настройки приватности обновлены');
    } catch (error) {
      toast.error('Ошибка при обновлении настроек');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Вы успешно вышли из аккаунта');
    } catch (error) {
      toast.error('Ошибка при выходе из аккаунта');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  const previewPlants = plants.slice(0, DESKTOP_PREVIEW);
  const previewShelves = shelves.slice(0, DESKTOP_PREVIEW);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight hidden sm:block">Профиль</h1>
        <p className="text-lg text-muted-foreground hidden sm:block">
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
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">Полное имя</span>
              </div>
              <p className="text-lg font-medium">{user.name}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-semibold">Email адрес</span>
              </div>
              <p className="text-lg font-medium">{user.email}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-semibold">Роль аккаунта</span>
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                <span className="text-sm font-semibold text-primary capitalize">{user.role}</span>
              </div>
            </div>

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

      {/* Settings Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Предпочтения</CardTitle>
            <CardDescription>Настройте ваш опыт использования приложения</CardDescription>
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

        {/* Logout */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Выход из аккаунта</CardTitle>
            <CardDescription>Завершите текущий сеанс</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} className="w-full gap-2" variant="outline">
              <LogOut className="w-4 h-4" />
              Выйти из аккаунта
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Настройки приватности
          </CardTitle>
          <CardDescription>
            Управляйте тем, что видят другие пользователи в вашем профиле
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {(user.showPlants ?? true) ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Показывать мои растения</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Другие пользователи смогут видеть ваши растения
              </p>
            </div>
            <Switch
              checked={user.showPlants ?? true}
              onCheckedChange={(v) => handlePrivacyChange('showPlants', v)}
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {(user.showShelves ?? true) ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Показывать мои полки</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Другие пользователи смогут видеть ваши полки
              </p>
            </div>
            <Switch
              checked={user.showShelves ?? true}
              onCheckedChange={(v) => handlePrivacyChange('showShelves', v)}
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {(user.showPlantHistory ?? true) ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Показывать историю растений</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Другие пользователи смогут просматривать историю ваших растений
              </p>
            </div>
            <Switch
              checked={user.showPlantHistory ?? true}
              onCheckedChange={(v) => handlePrivacyChange('showPlantHistory', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* My Plants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Мои растения
              </CardTitle>
              <CardDescription className="mt-1">
                {loadingPlants ? 'Загрузка...' : `Всего: ${plants.length}`}
              </CardDescription>
            </div>
            {plants.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href="/plants">
                  Показать все <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingPlants ? (
            <div className="text-center text-muted-foreground py-6">Загрузка растений...</div>
          ) : plants.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <Leaf className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p>У вас пока нет растений</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/plants">Добавить растение</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {previewPlants.map((plant, i) => (
                  <div key={plant._id} className={i >= MOBILE_PREVIEW ? 'hidden sm:block' : ''}>
                    <PlantCard plant={plant} index={i} />
                  </div>
                ))}
              </div>
              {plants.length > DESKTOP_PREVIEW && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/plants">Показать все {plants.length} растений</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* My Shelves */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Мои полки
              </CardTitle>
              <CardDescription className="mt-1">
                {loadingShelves ? 'Загрузка...' : `Всего: ${shelves.length}`}
              </CardDescription>
            </div>
            {shelves.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href="/shelves">
                  Показать все <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingShelves ? (
            <div className="text-center text-muted-foreground py-6">Загрузка полок...</div>
          ) : shelves.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <Layers className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p>У вас пока нет полок</p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/shelves">Создать полку</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {previewShelves.map((shelf, i) => (
                  <div key={shelf._id} className={i >= MOBILE_PREVIEW ? 'hidden sm:block' : ''}>
                    <ShelfCard shelf={shelf} index={i} />
                  </div>
                ))}
              </div>
              {shelves.length > DESKTOP_PREVIEW && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/shelves">Показать все {shelves.length} полок</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
