'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Calendar, Leaf, Layers } from 'lucide-react';
import { usersApi, UserProfileWithStats } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileWithStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadUserProfile(params.id as string);
    }
  }, [params.id]);

  const loadUserProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await usersApi.getUserProfile(userId);
      setProfile(data);
    } catch (error) {
      toast.error('Ошибка загрузки профиля пользователя');
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Пользователь не найден</p>
          <Button variant="outline" onClick={() => router.back()}>
            Назад
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 transition-all hover:scale-105 active:scale-95 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl">{profile.name}</CardTitle>
              <p className="text-muted-foreground">Участник с {new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plants Count */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Растения</CardTitle>
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{profile.stats.totalPlants}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Всего растений в коллекции
            </p>
          </CardContent>
        </Card>

        {/* Shelves Count */}
        <Card className="transition-all hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Полки</CardTitle>
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{profile.stats.totalShelves}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Всего полок для растений
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
