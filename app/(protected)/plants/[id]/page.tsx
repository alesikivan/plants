'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, FileText, Leaf, Trash2, Pencil, Layers, Archive, ArchiveRestore } from 'lucide-react';
import { plantsApi, Plant, Genus, Variety, Shelf, getPlantPhotoUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { getDisplayName } from '@/lib/utils/language';
import { toast } from 'sonner';
import { EditPlantModal } from '@/components/plants/EditPlantModal';
import { PlantHistoryTimeline } from '@/components/plants/PlantHistoryTimeline';
import { PhotoGallery } from '@/components/plants/PhotoGallery';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function PlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const backUrl = searchParams.get('from') === 'archive' ? '/plants?tab=archive' : '/plants';
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadPlant(params.id as string);
    }
  }, [params.id]);

  const loadPlant = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await plantsApi.getOne(id);
      setPlant(data);
    } catch (error) {
      toast.error('Ошибка загрузки растения');
      console.error('Failed to load plant:', error);
      router.push(backUrl);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plant) return;

    setIsDeleting(true);
    try {
      await plantsApi.delete(plant._id);
      toast.success('Растение успешно удалено');
      router.push(backUrl);
    } catch (error) {
      toast.error('Ошибка при удалении растения');
      console.error('Failed to delete plant:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!plant) return;
    setIsArchiving(true);
    try {
      const updated = await plantsApi.archive(plant._id);
      setPlant(updated);
      toast.success('Растение перемещено в архив');
    } catch (error) {
      toast.error('Ошибка при архивировании растения');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!plant) return;
    setIsArchiving(true);
    try {
      const updated = await plantsApi.unarchive(plant._id);
      setPlant(updated);
      toast.success('Растение восстановлено из архива');
    } catch (error) {
      toast.error('Ошибка при восстановлении растения');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleEditSuccess = () => {
    if (params.id) {
      loadPlant(params.id as string);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64  fade-in duration-300">
        <div className="text-center space-y-2">
          <Leaf className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!plant) {
    return null;
  }

  const genus = typeof plant.genusId === 'object' ? plant.genusId as Genus : null;
  const variety = typeof plant.varietyId === 'object' ? plant.varietyId as Variety : null;

  const plantName = [
    getDisplayName(genus, language),
    getDisplayName(variety, language),
  ].filter(Boolean).join(' - ');

  const photoUrl = getPlantPhotoUrl(plant.photo);

  return (
    <div className="space-y-6 fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 fade-in slide-in-from-top-2 duration-500 overflow-x-auto">
        <Button
          variant="ghost"
          onClick={() => router.push(backUrl)}
          className="gap-2 transition-all active:scale-95 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Назад к списку</span>
        </Button>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          {plant.isArchived ? (
            <Button
              variant="outline"
              onClick={handleUnarchive}
              disabled={isArchiving}
              className="gap-2 transition-all active:scale-95"
            >
              <ArchiveRestore className="w-4 h-4" />
              <span className="hidden sm:inline">{isArchiving ? 'Восстановление...' : 'Восстановить'}</span>
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isArchiving}
                  className="gap-2 border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-all active:scale-95"
                >
                  <Archive className="w-4 h-4" />
                  <span className="hidden sm:inline">{isArchiving ? 'Архивирование...' : 'Архив'}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Архивировать растение?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Растение будет удалено из всех полок и перемещено в архив.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="transition-all active:scale-95">Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleArchive}
                    disabled={isArchiving}
                    className="transition-all active:scale-95"
                  >
                    {isArchiving ? 'Архивирование...' : 'Архивировать'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {!plant.isArchived && (
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-2 transition-all active:scale-95"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Редактировать</span>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-all active:scale-95">
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Удалить</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Растение будет удалено навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="transition-all active:scale-95">Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="transition-all active:scale-95"
                >
                  {isDeleting ? 'Удаление...' : 'Удалить'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Edit Modal */}
      {plant && (
        <EditPlantModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleEditSuccess}
          plant={plant}
        />
      )}

      {/* Plant Info */}
      <Card className="fade-in slide-in-from-bottom-2 duration-500">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Photo - компактное */}
            <div className="flex-shrink-0 w-full sm:w-48 md:w-56">
              <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden rounded-lg group">
                {photoUrl ? (
                  <button
                    onClick={() => setIsPhotoGalleryOpen(true)}
                    className="w-full h-full"
                  >
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

            {/* Details - объединенные */}
            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-semibold">{plantName || 'Без названия'}</h1>
                  {plant.isArchived && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                      <Archive className="w-3 h-3" />
                      В архиве
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Информация о растении</p>
              </div>

              <div className="grid gap-3 sm:gap-4">
                <div className="flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Род растения</p>
                    <p className="text-sm text-muted-foreground truncate">{getDisplayName(genus, language) || 'Не указан'}</p>
                  </div>
                </div>

                {variety && (
                  <div className="flex items-start gap-3">
                    <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Сорт растения</p>
                      <p className="text-sm text-muted-foreground truncate">{getDisplayName(variety, language)}</p>
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
                    <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium mb-1">Описание</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {plant.description}
                      </p>
                    </div>
                  </div>
                )}

                {plant.shelves && plant.shelves.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium mb-2">
                        Полки ({plant.shelves.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {plant.shelves.map((shelf) => {
                          const shelfData = shelf as Shelf;
                          return (
                            <Button
                              key={shelfData._id}
                              variant="outline"
                              size="sm"
                              className="transition-all active:scale-95"
                              onClick={() => router.push(`/shelves/${shelfData._id}`)}
                            >
                              <Layers className="w-3 h-3 mr-1.5" />
                              {shelfData.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plant History Timeline */}
      <PlantHistoryTimeline plantId={plant._id} />

      {/* Photo Gallery */}
      {isPhotoGalleryOpen && photoUrl && (
        <PhotoGallery
          photos={[photoUrl]}
          initialIndex={0}
          onClose={() => setIsPhotoGalleryOpen(false)}
        />
      )}
    </div>
  );
}
