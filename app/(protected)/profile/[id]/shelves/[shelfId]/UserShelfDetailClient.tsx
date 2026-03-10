'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Layers, Leaf } from 'lucide-react';
import { usersApi, Shelf, getShelfPhotoUrl, getPlantPhotoUrl } from '@/lib/api';
import { PlantCard } from '@/components/plants/PlantCard';
import { toast } from 'sonner';

export default function UserShelfDetailClient() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const shelfId = params.shelfId as string;

  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !shelfId) return;
    usersApi.getUserShelf(userId, shelfId)
      .then(setShelf)
      .catch(() => {
        toast.error('Ошибка загрузки полки');
        router.back();
      })
      .finally(() => setIsLoading(false));
  }, [userId, shelfId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <Layers className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!shelf) return null;

  const photoUrl = getShelfPhotoUrl(shelf.photo);
  const plants = shelf.plants || [];
  const plantPhotos = plants.map(p => getPlantPhotoUrl(p.photo)).filter(Boolean).slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Button>

      {/* Shelf Info */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-32">
              <div className="relative bg-background rounded-lg overflow-hidden shadow-sm h-32 border">
                {photoUrl ? (
                  <img src={photoUrl} alt={shelf.name} className="w-full h-full object-cover" />
                ) : plantPhotos.length > 0 ? (
                  <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-muted/5 to-muted/20">
                    <div className="relative w-full h-full">
                      {plantPhotos.map((pUrl, idx) => {
                        const total = plantPhotos.length;
                        const rot = total === 1 ? 0 : total === 2 ? (idx === 0 ? -12 : 12) : (idx - 1) * 15;
                        const hOff = total === 1 ? 50 : total === 2 ? (idx === 0 ? 35 : 65) : [30, 50, 70][idx];
                        const vOff = total === 1 ? 50 : Math.abs(idx - (total - 1) / 2) * 8 + 45;
                        return (
                          <div
                            key={idx}
                            className="absolute rounded-lg overflow-hidden shadow-xl border-4 border-white"
                            style={{
                              width: '55%', height: '75%',
                              left: `${hOff}%`, top: `${vOff}%`,
                              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                              zIndex: total === 3 && idx === 1 ? 10 : total - idx,
                            }}
                          >
                            <img src={pUrl} alt={`Plant ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/20">
                    <Layers className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}
                {plants.length > 0 && (
                  <div style={{ zIndex: 10 }} className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 shadow-sm">
                    <Leaf className="w-3 h-3" />
                    {plants.length}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Название</p>
                  <p className="text-sm text-muted-foreground">{shelf.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Количество растений</p>
                  <p className="text-sm text-muted-foreground">{plants.length}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plants on Shelf */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>Растения на полке</CardTitle>
          <CardDescription>
            {plants.length > 0 ? 'Нажмите на растение, чтобы посмотреть детали' : 'На этой полке пока нет растений'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plants.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {plants.map((plant, index) => (
                <PlantCard
                  key={plant._id}
                  plant={plant}
                  index={index}
                  href={`/profile/${userId}/plants/${plant._id}`}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Leaf className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">На полке пока нет растений</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
