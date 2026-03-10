'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, FileText, Leaf, AlertCircle } from 'lucide-react';
import { plantsApi, Plant, Genus, Variety, getPlantPhotoUrl } from '@/lib/api';
import { getDisplayName } from '@/lib/utils/language';
import { PlantHistoryTimeline } from '@/components/plants/PlantHistoryTimeline';
import { PhotoGallery } from '@/components/plants/PhotoGallery';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DiscoverBanner } from '@/components/public/DiscoverBanner';

export default function PublicPlantDetailClient() {
  const params = useParams();
  const [plant, setPlant] = useState<
    (Plant & { showPlantHistory: boolean; owner?: { _id: string; name: string } }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

  useEffect(() => {
    if (params.plantId) {
      loadPlant(params.plantId as string);
    }
  }, [params.plantId]);

  const loadPlant = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await plantsApi.getPublic(id);
      setPlant(data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Растение не найдено или скрыто владельцем');
      } else {
        setError('Ошибка загрузки растения');
      }
      console.error('Failed to load plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className="space-y-6 fade-in slide-in-from-bottom-2 duration-700">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!plant) {
    return null;
  }

  const genus = typeof plant.genusId === 'object' ? (plant.genusId as Genus) : null;
  const variety = typeof plant.varietyId === 'object' ? (plant.varietyId as Variety) : null;

  const plantName = [getDisplayName(genus, 'ru'), getDisplayName(variety, 'ru')]
    .filter(Boolean)
    .join(' - ');

  const photoUrl = getPlantPhotoUrl(plant.photo);

  return (
    <div className="space-y-6 fade-in slide-in-from-bottom-2 duration-700">
      <Card className="fade-in slide-in-from-bottom-2 duration-500">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex-shrink-0 w-full sm:w-48 md:w-56">
              <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden rounded-lg group">
                {photoUrl ? (
                  <button
                    onClick={() => setIsPhotoGalleryOpen(true)}
                    className="w-full h-full hover:bg-black/5 transition-colors"
                  >
                    <img
                      src={photoUrl}
                      alt={plantName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                    <Leaf className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{plantName}</h1>
                {plant?.owner && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Владелец: <span className="font-medium text-foreground">{plant.owner.name}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {genus && (
                  <div className="flex items-start gap-3">
                    <Leaf className="w-4 h-4 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Род</p>
                      <p className="font-medium">{getDisplayName(genus, 'ru')}</p>
                    </div>
                  </div>
                )}

                {variety && (
                  <div className="flex items-start gap-3">
                    <Leaf className="w-4 h-4 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Сорт</p>
                      <p className="font-medium">{getDisplayName(variety, 'ru')}</p>
                    </div>
                  </div>
                )}

                {plant.purchaseDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Дата приобретения</p>
                      <p className="font-medium">
                        {new Date(plant.purchaseDate).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {plant.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Описание</p>
                      <p className="font-medium whitespace-pre-wrap">{plant.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isPhotoGalleryOpen && photoUrl && (
        <PhotoGallery
          photos={[photoUrl]}
          initialIndex={0}
          onClose={() => setIsPhotoGalleryOpen(false)}
        />
      )}

      <DiscoverBanner />

      {plant.showPlantHistory ? (
        <PlantHistoryTimeline plantId={plant._id} isPublic={true} />
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>История растения скрыта владельцем</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
