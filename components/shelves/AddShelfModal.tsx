'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { FileInput } from '@/components/ui/file-input';
import { shelvesApi, plantsApi, Plant, getPlantPhotoUrl } from '@/lib/api';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { Checkbox } from '@/components/ui/checkbox';
import { Leaf, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { getDisplayName } from '@/lib/utils/language';

interface AddShelfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editShelf?: {
    _id: string;
    name: string;
    photo?: string;
    plants?: Plant[];
  };
}

interface ShelfFormData {
  name: string;
}

export function AddShelfModal({ open, onOpenChange, onSuccess, editShelf }: AddShelfModalProps) {
  const t = useTranslations('AddShelfModal');
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    editShelf?.photo ? `${process.env.NEXT_PUBLIC_API_URL}/shelves/photo/${editShelf.photo}` : null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);
  const [plantSearch, setPlantSearch] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<ShelfFormData>({
    defaultValues: {
      name: editShelf?.name || '',
    },
  });

  const nameValue = useWatch({ control, name: 'name', defaultValue: editShelf?.name || '' });

  // Загрузка растений при открытии модального окна
  useEffect(() => {
    if (open) {
      trackEvent(editShelf ? 'shelf_edit_modal_opened' : 'shelf_create_modal_opened');
      loadPlants();
      // Если редактирование - устанавливаем уже добавленные растения
      if (editShelf?.plants) {
        const validIds = editShelf.plants
          .map(p => p._id)
          .filter(id => id && id !== 'undefined' && id !== 'null');
        setSelectedPlantIds(validIds);
      }
    }
  }, [open, editShelf]);

  const loadPlants = async () => {
    setIsLoadingPlants(true);
    try {
      const data = await plantsApi.getAll();
      if (editShelf) {
        // При редактировании показываем растения без полки + растения текущей полки
        const availablePlants = data.filter(
          plant => plant.shelfIds.length === 0 || plant.shelfIds.includes(editShelf._id)
        );
        setPlants(availablePlants);
      } else {
        // При создании показываем все растения (они могут быть на других полках)
        setPlants(data);
      }
    } catch (error) {
      toast.error(t('plants.loadError'));
      console.error('Failed to load plants:', error);
    } finally {
      setIsLoadingPlants(false);
    }
  };

  const onSubmit = async (data: ShelfFormData) => {
    setIsLoading(true);
    try {
      if (editShelf) {
        // Обновляем информацию о полке
        await shelvesApi.update(editShelf._id, {
          name: data.name,
          photo: selectedFile || undefined,
          removePhoto,
        });

        // Управление растениями при редактировании
        const currentPlantIds = editShelf.plants?.map(p => p._id).filter(id => id && id !== 'undefined') || [];
        const validSelectedIds = selectedPlantIds.filter(id => id && id !== 'undefined' && id !== 'null');

        const plantsToAdd = validSelectedIds.filter(id => !currentPlantIds.includes(id));
        const plantsToRemove = currentPlantIds.filter(id => !validSelectedIds.includes(id));

        // Добавляем новые растения
        if (plantsToAdd.length > 0) {
          await Promise.all(
            plantsToAdd.map(plantId => shelvesApi.addPlant(editShelf._id, plantId))
          );
        }

        // Убираем растения
        if (plantsToRemove.length > 0) {
          await Promise.all(
            plantsToRemove.map(plantId => shelvesApi.removePlant(editShelf._id, plantId))
          );
        }

        trackEvent('shelf_updated', { has_photo: !!selectedFile, plants_count: selectedPlantIds.length });
        toast.success(t('toasts.editSuccess'));
      } else {
        const shelf = await shelvesApi.create({
          name: data.name,
          photo: selectedFile || undefined,
        });

        // Привязываем выбранные растения к новой полке
        const validPlantIds = selectedPlantIds.filter(id => id && id !== 'undefined' && id !== 'null');
        if (validPlantIds.length > 0) {
          await Promise.all(
            validPlantIds.map(plantId =>
              shelvesApi.addPlant(shelf._id, plantId)
            )
          );
        }

        trackEvent('shelf_created', { has_photo: !!selectedFile, plants_count: selectedPlantIds.length });
        toast.success(t('toasts.createSuccess'));
      }

      reset();
      setPhotoPreview(null);
      setSelectedFile(null);
      setRemovePhoto(false);
      setSelectedPlantIds([]);
      setPlantSearch('');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(editShelf ? t('toasts.editError') : t('toasts.createError'));
      console.error('Failed to save shelf:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPhotoPreview(null);
      return;
    }

    if (!file.type.match(/image\/(jpg|jpeg|png|gif|webp)/)) {
      toast.error(t('invalidFileType'));
      return;
    }

    trackEvent('shelf_photo_selected');
    setSelectedFile(file);
    setRemovePhoto(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    trackEvent('shelf_photo_removed');
    setSelectedFile(null);
    setPhotoPreview(null);
    if (editShelf?.photo) {
      setRemovePhoto(true);
    }
  };

  const handlePlantToggle = (plantId: string) => {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editShelf ? t('titleEdit') : t('titleCreate')}</DialogTitle>
          <DialogDescription>
            {editShelf ? t('descriptionEdit') : t('descriptionCreate')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Название полки */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                {t('fields.name.label')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder={t('fields.name.placeholder')}
                  {...register('name', { required: true, maxLength: 30 })}
                />
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${(nameValue?.length || 0) > 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {nameValue?.length || 0}/30
                </span>
              </div>
              {errors.name?.type === 'required' && (
                <p className="text-sm text-destructive">{t('fields.name.required')}</p>
              )}
              {errors.name?.type === 'maxLength' && (
                <p className="text-sm text-destructive">{t('fields.name.maxLength')}</p>
              )}
            </div>

            {/* Фото полки */}
            <div className="grid gap-2">
              <Label htmlFor="photo">{t('fields.photo.label')} </Label>
              <FileInput
                id="photo"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onFileChange={handleFileChange}
                preview={photoPreview}
                onRemove={handleRemovePhoto}
                maxSize={5 * 1024 * 1024}
                acceptedFormats={['JPG', 'PNG', 'GIF', 'WebP']}
              />
              <p className="text-xs text-muted-foreground">
                {t('fields.photo.helper')}
              </p>
            </div>

            {/* Выбор растений */}
            <div className="grid gap-2">
              <Label>{editShelf ? t('plants.manageLabel') : t('plants.addLabel')}</Label>
                {isLoadingPlants ? (
                  <div className="flex items-center justify-center py-4">
                    <Leaf className="w-5 h-5 text-primary/50 animate-pulse" />
                    <span className="ml-2 text-sm text-muted-foreground">{t('plants.loadingText')}</span>
                  </div>
                ) : plants.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2 px-3 bg-muted/30 rounded-md">
                    {t('plants.noPlants')}
                  </div>
                ) : (
                  <>
                    {/* Поиск */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t('plants.search.placeholder')}
                        value={plantSearch}
                        onChange={(e) => setPlantSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Список растений */}
                    <div className="border rounded-md max-h-60 overflow-y-auto">
                      {filteredPlants.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {t('plants.notFound')}
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
                                <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  {photoUrl ? (
                                    <img
                                      src={photoUrl}
                                      alt={getPlantDisplayName(plant)}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Leaf className="w-5 h-5 text-muted-foreground/50" />
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
                {selectedPlantIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('plants.selectedCount', { count: selectedPlantIds.length })}
                  </p>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
                setPhotoPreview(null);
                setSelectedFile(null);
                setRemovePhoto(false);
                setSelectedPlantIds([]);
                setPlantSearch('');
              }}
              disabled={isLoading}
            >
              {t('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? (editShelf ? t('buttons.editing') : t('buttons.creating'))
                : (editShelf ? t('buttons.editButton') : t('buttons.createButton'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
