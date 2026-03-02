'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calendar, EyeOff, FileText, Leaf, MessageSquare } from 'lucide-react';
import { usersApi, Plant, PlantHistory, Genus, Variety, getPlantPhotoUrl, getPlantHistoryPhotoUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { getDisplayName } from '@/lib/utils/language';
import { toast } from 'sonner';
import { PhotoGallery } from '@/components/plants/PhotoGallery';

export default function UserPlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const plantId = params.plantId as string;

  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';

  const [plant, setPlant] = useState<Plant | null>(null);
  const [history, setHistory] = useState<PlantHistory[]>([]);
  const [historyHidden, setHistoryHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [selectedHistoryPhotos, setSelectedHistoryPhotos] = useState<{ photos: string[]; index: number } | null>(null);

  useEffect(() => {
    if (!userId || !plantId) return;
    setIsLoading(true);
    Promise.all([
      usersApi.getUserPlant(userId, plantId),
      usersApi.getUserPlantHistory(userId, plantId).catch((err) => {
        if (err?.response?.status === 403) setHistoryHidden(true);
        return [];
      }),
    ])
      .then(([plantData, historyData]) => {
        setPlant(plantData);
        setHistory(historyData as PlantHistory[]);
      })
      .catch(() => {
        toast.error('Ошибка загрузки растения');
        router.back();
      })
      .finally(() => setIsLoading(false));
  }, [userId, plantId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 fade-in duration-300">
        <div className="text-center space-y-2">
          <Leaf className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!plant) return null;

  const genus = typeof plant.genusId === 'object' ? plant.genusId as Genus : null;
  const variety = typeof plant.varietyId === 'object' ? plant.varietyId as Variety : null;

  const plantName = [getDisplayName(genus, language), getDisplayName(variety, language)]
    .filter(Boolean).join(' - ');
  const photoUrl = getPlantPhotoUrl(plant.photo);

  return (
    <div className="space-y-6 fade-in slide-in-from-bottom-2 duration-700">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 transition-all hover:scale-105 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Button>

      {/* Plant Info */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex-shrink-0 w-full sm:w-48 md:w-56">
              <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden rounded-lg group">
                {photoUrl ? (
                  <button onClick={() => setIsPhotoGalleryOpen(true)} className="w-full h-full">
                    <img
                      src={photoUrl}
                      alt={plantName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    />
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Leaf className="w-20 h-20 sm:w-24 sm:h-24 text-primary/30" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold mb-1">{plantName || 'Без названия'}</h1>
                <p className="text-sm text-muted-foreground">Информация о растении</p>
              </div>

              <div className="grid gap-3 sm:gap-4">
                <div className="flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Род растения</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {getDisplayName(genus, language) || 'Не указан'}
                    </p>
                  </div>
                </div>

                {variety && (
                  <div className="flex items-start gap-3">
                    <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Сорт растения</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {getDisplayName(variety, language)}
                      </p>
                    </div>
                  </div>
                )}

                {plant.purchaseDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Дата покупки</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(plant.purchaseDate).toLocaleDateString('ru-RU', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {plant.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium mb-1">Описание</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {plant.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History (read-only) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">История растения</CardTitle>
          <CardDescription>
            {historyHidden ? 'Скрыта пользователем' : history.length > 0 ? `Всего записей: ${history.length}` : 'История пуста'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {historyHidden ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <EyeOff className="w-5 h-5" />
              <span>Пользователь скрыл историю своих растений</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <MessageSquare className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm">История пока пуста</p>
            </div>
          ) : (
            <div className="relative">
              {history.map((item, index) => {
                const isLast = index === history.length - 1;
                const photoUrls = item.photos.map(p => getPlantHistoryPhotoUrl(p)!);
                const formattedDate = new Date(item.date).toLocaleDateString('ru-RU', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                });
                return (
                  <div key={item._id} className="relative flex gap-3">
                    <div className="relative flex flex-col items-center pt-1">
                      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center z-10 flex-shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {!isLast && (
                        <div className="absolute top-11 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-border" />
                      )}
                    </div>

                    <div className="flex-1 pb-8 pt-1">
                      <span className="text-xs text-muted-foreground">{formattedDate}</span>
                      {item.comment && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mt-2 mb-3">
                          {item.comment}
                        </p>
                      )}
                      {item.photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                          {item.photos.map((photo, photoIdx) => (
                            <button
                              key={photo}
                              onClick={() => setSelectedHistoryPhotos({ photos: photoUrls, index: photoIdx })}
                              className="aspect-square rounded-lg overflow-hidden bg-muted transition-all hover:scale-105 hover:shadow-md active:scale-95"
                            >
                              <img
                                src={getPlantHistoryPhotoUrl(photo)}
                                alt={`Фото ${photoIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isPhotoGalleryOpen && photoUrl && (
        <PhotoGallery
          photos={[photoUrl]}
          initialIndex={0}
          onClose={() => setIsPhotoGalleryOpen(false)}
        />
      )}

      {selectedHistoryPhotos && (
        <PhotoGallery
          photos={selectedHistoryPhotos.photos}
          initialIndex={selectedHistoryPhotos.index}
          onClose={() => setSelectedHistoryPhotos(null)}
        />
      )}
    </div>
  );
}
