'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Leaf, Layers, ArrowLeft, ChevronRight, EyeOff } from 'lucide-react';
import { usersApi, UserProfileWithStats, Plant, Shelf } from '@/lib/api';
import { getAvatarUrl } from '@/lib/api/users';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PlantCard } from '@/components/plants/PlantCard';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { AvatarViewer } from '@/components/profile/AvatarViewer';
import { SocialLinksSection } from '@/components/profile/SocialLinksSection';

const DESKTOP_PREVIEW = 5;
const MOBILE_PREVIEW = 3;

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const [profile, setProfile] = useState<UserProfileWithStats | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [loadingShelves, setLoadingShelves] = useState(false);
  const [isAvatarViewerOpen, setIsAvatarViewerOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    usersApi.getUserProfile(userId)
      .then((data) => {
        setProfile(data);
        if (isAdmin || (data.showPlants ?? true)) {
          setLoadingPlants(true);
          usersApi.getUserPlants(userId)
            .then(setPlants).catch(() => {}).finally(() => setLoadingPlants(false));
        }
        if (isAdmin || (data.showShelves ?? true)) {
          setLoadingShelves(true);
          usersApi.getUserShelves(userId)
            .then(setShelves).catch(() => {}).finally(() => setLoadingShelves(false));
        }
      })
      .catch(() => toast.error('Ошибка загрузки профиля пользователя'))
      .finally(() => setIsLoading(false));
  }, [userId]);

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
          <Button variant="outline" onClick={() => router.back()}>Назад</Button>
        </div>
      </div>
    );
  }

  const previewPlants = plants.slice(0, DESKTOP_PREVIEW);
  const previewShelves = shelves.slice(0, DESKTOP_PREVIEW);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 transition-all active:scale-95 mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Button>

      {/* Profile Card */}
      <Card>
        <CardHeader className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
              onClick={() => profile.avatar && setIsAvatarViewerOpen(true)}
              className={`w-16 h-16 rounded-2xl overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0 transition-all hover:scale-105 ${
                profile.avatar ? 'cursor-pointer' : ''
              }`}
            >
              {profile.avatar ? (
                <Image
                  src={getAvatarUrl(profile.avatar)!}
                  alt={profile.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </button>
              <div>
                <CardTitle className="text-xl leading-tight">{profile.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Участник с{' '}
                  {new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="px-3 min-w-[76px] h-[80px] flex flex-col items-center justify-center bg-green-50 dark:bg-green-950/20 rounded-lg">
                <Leaf className="w-5 h-5 text-green-600 mb-0.5" />
                <p className="text-lg font-bold text-green-700 dark:text-green-400 leading-tight">{profile.stats.totalPlants}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Растения</p>
              </div>
              <div className="px-3 min-w-[76px] h-[80px] flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Layers className="w-5 h-5 text-blue-600 mb-0.5" />
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400 leading-tight">{profile.stats.totalShelves}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Полки</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Social Links */}
      {profile.socialLinks && profile.socialLinks.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <SocialLinksSection
              socialLinks={profile.socialLinks}
              isReadOnly={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Plants Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Растения
            </CardTitle>
            {(isAdmin || (profile.showPlants ?? true)) && plants.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href={`/profile/${userId}/plants`}>
                  Показать все <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isAdmin && !(profile.showPlants ?? true) ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <EyeOff className="w-5 h-5" />
              <span>Пользователь скрыл свою коллекцию растений</span>
            </div>
          ) : loadingPlants ? (
            <div className="text-center text-muted-foreground py-6">Загрузка...</div>
          ) : plants.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <Leaf className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p>Нет растений</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {previewPlants.map((plant, i) => (
                  <div key={plant._id} className={i >= MOBILE_PREVIEW ? 'hidden sm:block' : ''}>
                    <PlantCard
                      plant={plant}
                      index={i}
                      href={`/profile/${userId}/plants/${plant._id}`}
                    />
                  </div>
                ))}
              </div>
              {plants.length > DESKTOP_PREVIEW && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/${userId}/plants`}>
                      Показать все {plants.length} растений
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Shelves Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Полки
            </CardTitle>
            {(isAdmin || (profile.showShelves ?? true)) && shelves.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link href={`/profile/${userId}/shelves`}>
                  Показать все <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isAdmin && !(profile.showShelves ?? true) ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <EyeOff className="w-5 h-5" />
              <span>Пользователь скрыл свои полки</span>
            </div>
          ) : loadingShelves ? (
            <div className="text-center text-muted-foreground py-6">Загрузка...</div>
          ) : shelves.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              <Layers className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
              <p>Нет полок</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {previewShelves.map((shelf, i) => (
                  <div key={shelf._id} className={i >= MOBILE_PREVIEW ? 'hidden sm:block' : ''}>
                    <ShelfCard
                      shelf={shelf}
                      index={i}
                      href={`/profile/${userId}/shelves/${shelf._id}`}
                    />
                  </div>
                ))}
              </div>
              {shelves.length > DESKTOP_PREVIEW && (
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/${userId}/shelves`}>
                      Показать все {shelves.length} полок
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Avatar Viewer */}
      {isAvatarViewerOpen && profile.avatar && (
        <AvatarViewer
          avatarUrl={getAvatarUrl(profile.avatar)!}
          userName={profile.name}
          onClose={() => setIsAvatarViewerOpen(false)}
        />
      )}
    </div>
  );
}
