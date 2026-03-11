'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { shelvesApi, plantsApi, Plant, getPlantPhotoUrl } from '@/lib/api';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Leaf, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { getDisplayName } from '@/lib/utils/language';

interface ManagePlantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shelf: {
    _id: string;
    name: string;
    plants?: Plant[];
  };
}

export function ManagePlantsModal({ open, onOpenChange, onSuccess, shelf }: ManagePlantsModalProps) {
  const t = useTranslations('ManagePlantsModal');
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [plantSearch, setPlantSearch] = useState('');

  // Загрузка растений при открытии модального окна
  useEffect(() => {
    if (open) {
      loadPlants();
      // Устанавливаем уже добавленные растения
      if (shelf.plants) {
        const validIds = shelf.plants
          .map(p => p._id)
          .filter(id => id && id !== 'undefined' && id !== 'null');
        setSelectedPlantIds(validIds);
      }
    }
  }, [open, shelf]);

  const loadPlants = async () => {
    setIsLoadingPlants(true);
    try {
      const data = await plantsApi.getAll();
      // Теперь все растения могут быть на нескольких полках, показываем все
      setPlants(data);
    } catch (error) {
      toast.error(t('loadingText'));
      console.error('Failed to load plants:', error);
    } finally {
      setIsLoadingPlants(false);
    }
  };

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      // Фильтруем только валидные ID перед отправкой
      const validPlantIds = selectedPlantIds.filter(id => id && id !== 'undefined' && id !== 'null');

      // Используем новый метод для массового обновления
      await shelvesApi.updatePlants(shelf._id, validPlantIds);

      const currentPlantIds = shelf.plants?.map(p => p._id).filter(id => id && id !== 'undefined') || [];
      const totalChanges =
        validPlantIds.filter(id => !currentPlantIds.includes(id)).length +
        currentPlantIds.filter(id => !validPlantIds.includes(id)).length;

      if (totalChanges > 0) {
        toast.success(t('toasts.updated', { count: totalChanges }));
      } else {
        toast.info(t('toasts.noChanges'));
      }

      setSelectedPlantIds([]);
      setPlantSearch('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(t('toasts.updateError'));
      console.error('Failed to update plants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlantToggle = (plantId: string) => {
    // Проверяем валидность ID перед добавлением
    if (!plantId || plantId === 'undefined' || plantId === 'null') {
      console.error('Invalid plant ID:', plantId);
      return;
    }

    setSelectedPlantIds(prev =>
      prev.includes(plantId)
        ? prev.filter(id => id !== plantId)
        : [...prev, plantId]
    );
  };

  const getPlantDisplayName = (plant: Plant) => {
    const genus = typeof plant.genusId === 'object' ? plant.genusId : null;
    const variety = typeof plant.varietyId === 'object' ? plant.varietyId : null;

    const genusName = getDisplayName(genus, language);
    const varietyName = getDisplayName(variety, language);

    return [genusName, varietyName].filter(Boolean).join(' - ') || 'Noname';
  };

  // Фильтрация растений по поисковому запросу
  const filteredPlants = plants.filter(plant => {
    if (!plantSearch) return true;
    const displayName = getPlantDisplayName(plant).toLowerCase();
    return displayName.includes(plantSearch.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { shelfName: shelf.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Статистика */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">{t('stats.selected')}</span>
              <span className="ml-2 text-primary font-semibold">{selectedPlantIds.length}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('stats.available')} {plants.length}
            </div>
          </div>

          {/* Поиск и список */}
          {isLoadingPlants ? (
            <div className="flex items-center justify-center py-8">
              <Leaf className="w-5 h-5 text-primary/50 animate-pulse" />
              <span className="ml-2 text-sm text-muted-foreground">{t('loadingText')}</span>
            </div>
          ) : plants.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 px-3 bg-muted/30 rounded-md text-center">
              {t('noPlants')}
            </div>
          ) : (
            <>
              {/* Поиск */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={plantSearch}
                  onChange={(e) => setPlantSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Список растений */}
              <div className="border rounded-md max-h-96 overflow-y-auto">
                {filteredPlants.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {t('notFound')}
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {filteredPlants.map((plant) => {
                      const photoUrl = getPlantPhotoUrl(plant.photo);
                      return (
                        <div
                          key={plant._id}
                          className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors"
                        >
                          <Checkbox
                            id={`plant-${plant._id}`}
                            checked={selectedPlantIds.includes(plant._id)}
                            onCheckedChange={() => handlePlantToggle(plant._id)}
                          />
                          {/* Фото растения */}
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt={getPlantDisplayName(plant)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Leaf className="w-6 h-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          {/* Название */}
                          <label
                            htmlFor={`plant-${plant._id}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {getPlantDisplayName(plant)}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedPlantIds([]);
              setPlantSearch('');
            }}
            disabled={isLoading}
          >
            {t('buttons.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? t('buttons.saving') : t('buttons.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
