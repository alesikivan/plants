'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { adminApi } from '@/lib/api/admin';
import { Role } from '@/lib/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users,
  Leaf,
  Layers,
  HardDrive,
  BookOpen,
  Tag,
  History,
  Loader,
  Image,
  Package,
  ListTodo,
  ImageIcon,
  Archive,
} from 'lucide-react';
import { ApiError } from '@/lib/api/errors';

type PeriodKey = 'today' | 'last3days' | 'lastWeek' | 'lastMonth';

interface Period {
  key: PeriodKey;
  label: string;
}

const PERIODS: Period[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'last3days', label: '3 дня' },
  { key: 'lastWeek', label: 'Неделя' },
  { key: 'lastMonth', label: 'Месяц' },
];

const STAT_ICON_MAP: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  users: Users,
  plants: Leaf,
  shelves: Layers,
  plantHistory: History,
  genus: BookOpen,
  varieties: Tag,
};

const STAT_LABELS: Record<string, string> = {
  users: 'Пользователи',
  plants: 'Растения',
  shelves: 'Полки',
  plantHistory: 'История растений',
  genus: 'Роды',
  varieties: 'Сорта',
};

const FOLDER_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'plant-history': History,
  'plants': Leaf,
  'shelves': Layers,
  'wishlist': ListTodo,
  'avatars': ImageIcon,
};

export default function AdminInfoPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('today');

  useEffect(() => {
    if (!initialized) return;
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/dashboard');
    }
  }, [user, initialized, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-info'],
    queryFn: () => adminApi.getInfo(),
    enabled: initialized && user?.role === Role.ADMIN,
  });

  useEffect(() => {
    if (error) {
      const apiError = error as unknown as ApiError;
      toast.error(apiError?.message || 'Ошибка загрузки информации');
    }
  }, [error]);

  if (!initialized || !user) return null;

  const uploads = data?.uploads;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">Статистика системы</h1>
        <p className="text-muted-foreground mt-2">
          Информация об использовании хранилища и ключевые метрики
        </p>
      </div>

      {/* Uploads Section */}
      {uploads && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Хранилище
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="flex items-center gap-8">
              <div>
                <div className="text-sm text-muted-foreground">Файлов</div>
                <div className="text-3xl font-bold">
                  {uploads.total.files.toLocaleString('ru-RU')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Объём</div>
                <div className="text-3xl font-bold">
                  {uploads.total.sizeMb}
                </div>
              </div>
            </div>

            {/* Folders */}
            {uploads.byFolder.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">По папкам</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {uploads.byFolder.map((folder) => {
                    const Icon = FOLDER_ICONS[folder.name] || Package;
                    const totalSizeMb = parseFloat(uploads.total.sizeMb);
                    const folderSizeMb = parseFloat(folder.sizeMb);
                    const percentage = totalSizeMb > 0 ? (folderSizeMb / totalSizeMb) * 100 : 0;

                    return (
                      <div key={folder.name} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <Icon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{folder.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {folder.files.toLocaleString('ru-RU')} файлов
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-medium">{folder.sizeMb}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {uploads.byFolder.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Нет загруженных файлов
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Section */}
      {stats && (
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <CardTitle>Ключевые метрики</CardTitle>
              <div className="flex flex-wrap gap-2">
                {PERIODS.map((period) => (
                  <Button
                    key={period.key}
                    variant={
                      selectedPeriod === period.key ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setSelectedPeriod(period.key)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Users */}
                <StatCard
                  label={STAT_LABELS.users}
                  icon={STAT_ICON_MAP.users}
                  total={stats.users.total}
                  period={stats.users[selectedPeriod]}
                />

                {/* Plants */}
                <StatCard
                  label={STAT_LABELS.plants}
                  icon={STAT_ICON_MAP.plants}
                  total={stats.plants.total}
                  period={stats.plants[selectedPeriod]}
                  archived={stats.plants.archived}
                />

                {/* Shelves */}
                <StatCard
                  label={STAT_LABELS.shelves}
                  icon={STAT_ICON_MAP.shelves}
                  total={stats.shelves.total}
                  period={stats.shelves[selectedPeriod]}
                />

                {/* Plant History */}
                <StatCard
                  label={STAT_LABELS.plantHistory}
                  icon={STAT_ICON_MAP.plantHistory}
                  total={stats.plantHistory.total}
                  period={stats.plantHistory[selectedPeriod]}
                />

                {/* Genus */}
                <StatCard
                  label={STAT_LABELS.genus}
                  icon={STAT_ICON_MAP.genus}
                  total={stats.genus.total}
                />

                {/* Varieties */}
                <StatCard
                  label={STAT_LABELS.varieties}
                  icon={STAT_ICON_MAP.varieties}
                  total={stats.varieties.total}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  total: number;
  period?: number;
  archived?: number;
}

function StatCard({ label, icon: Icon, total, period, archived }: StatCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className="text-3xl font-bold">{total.toLocaleString('ru-RU')}</div>
          {period !== undefined && (
            <div className="text-sm text-muted-foreground">
              +{period.toLocaleString('ru-RU')} добавлено
            </div>
          )}
          {archived !== undefined && archived > 0 && (
            <div className="text-xs text-muted-foreground">
              ({archived.toLocaleString('ru-RU')} архивировано)
            </div>
          )}
        </div>
        <Icon className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
      </div>
    </div>
  );
}
