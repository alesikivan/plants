'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ComboBox } from '@/components/ui/combobox';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { Checkbox } from '@/components/ui/checkbox';
import { genusApi, varietyApi, plantsApi, shelvesApi, Genus, Variety, Plant, Shelf, getPlantPhotoUrl } from '@/lib/api';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';

interface EditPlantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  plant: Plant;
}

interface PlantFormData {
  genusId: string;
  varietyId?: string;
  shelfIds?: string[];
  purchaseDate?: Date;
  photo?: FileList;
  description?: string;
}

export function EditPlantModal({ open, onOpenChange, onSuccess, plant }: EditPlantModalProps) {
  const [genuses, setGenuses] = useState<Genus[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedGenusId, setSelectedGenusId] = useState<string>('');
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [genusSearch, setGenusSearch] = useState<string>('');
  const [varietySearch, setVarietySearch] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGenuses, setIsLoadingGenuses] = useState(false);
  const [isLoadingVarieties, setIsLoadingVarieties] = useState(false);
  const [isLoadingShelves, setIsLoadingShelves] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);

  const debouncedGenusSearch = useDebounce(genusSearch, 300);
  const debouncedVarietySearch = useDebounce(varietySearch, 300);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlantFormData>();

  // Инициализация формы данными растения
  useEffect(() => {
    if (open && plant) {
      const genusId = typeof plant.genusId === 'object' ? plant.genusId._id : plant.genusId;
      const varietyId = plant.varietyId
        ? (typeof plant.varietyId === 'object' ? plant.varietyId._id : plant.varietyId)
        : '';

      setSelectedGenusId(genusId);
      setSelectedVarietyId(varietyId || '');
      setSelectedShelfIds(plant.shelfIds || []);
      setPurchaseDate(plant.purchaseDate ? new Date(plant.purchaseDate) : undefined);
      setValue('description', plant.description || '');

      // Установка превью существующего фото
      if (plant.photo) {
        setPhotoPreview(getPlantPhotoUrl(plant.photo));
      } else {
        setPhotoPreview(null);
      }

      setSelectedFile(null);
      setRemoveCurrentPhoto(false);
    }
  }, [open, plant, setValue]);

  // Загрузка родов при открытии модального окна или изменении поиска
  useEffect(() => {
    if (open) {
      loadGenuses(debouncedGenusSearch);
      loadShelves();
    }
  }, [open, debouncedGenusSearch]);

  // Загрузка сортов при выборе рода или изменении поиска
  useEffect(() => {
    if (selectedGenusId) {
      loadVarieties(selectedGenusId, debouncedVarietySearch);
    } else {
      setVarieties([]);
    }
  }, [selectedGenusId, debouncedVarietySearch]);

  const loadGenuses = async (search?: string) => {
    setIsLoadingGenuses(true);
    try {
      const data = await genusApi.getAll(search);
      setGenuses(data);
    } catch (error) {
      toast.error('Ошибка загрузки родов растений');
      console.error('Failed to load genuses:', error);
    } finally {
      setIsLoadingGenuses(false);
    }
  };

  const loadVarieties = async (genusId: string, search?: string) => {
    setIsLoadingVarieties(true);
    try {
      const data = await varietyApi.getAll(genusId, search);
      setVarieties(data);
    } catch (error) {
      toast.error('Ошибка загрузки сортов растений');
      console.error('Failed to load varieties:', error);
    } finally {
      setIsLoadingVarieties(false);
    }
  };

  const loadShelves = async () => {
    setIsLoadingShelves(true);
    try {
      const data = await shelvesApi.getAll();
      setShelves(data);
    } catch (error) {
      toast.error('Ошибка загрузки полок');
      console.error('Failed to load shelves:', error);
    } finally {
      setIsLoadingShelves(false);
    }
  };

  const onSubmit = async (data: PlantFormData) => {
    setIsLoading(true);
    try {
      await plantsApi.update(plant._id, {
        genusId: selectedGenusId,
        varietyId: selectedVarietyId || undefined,
        shelfIds: selectedShelfIds,
        purchaseDate: purchaseDate ? purchaseDate.toISOString() : undefined,
        photo: selectedFile || undefined,
        description: data.description || undefined,
        removePhoto: removeCurrentPhoto,
      });
      toast.success('Растение успешно обновлено!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error('Ошибка при обновлении растения');
      console.error('Failed to update plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      // Если был выбран новый файл, но теперь его удалили
      if (selectedFile) {
        // Вернуть превью к оригинальному фото, если оно есть
        if (plant.photo && !removeCurrentPhoto) {
          setPhotoPreview(getPlantPhotoUrl(plant.photo));
        } else {
          setPhotoPreview(null);
        }
      }
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB');
      return;
    }

    // Check file type
    if (!file.type.match(/image\/(jpg|jpeg|png|gif|webp)/)) {
      toast.error('Разрешены только изображения (JPG, JPEG, PNG, GIF, WebP)');
      return;
    }

    setSelectedFile(file);
    setRemoveCurrentPhoto(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPhotoPreview(null);
    setRemoveCurrentPhoto(true);
  };

  const handleGenusChange = (value: string) => {
    setSelectedGenusId(value);
    setValue('genusId', value);
    setSelectedVarietyId(''); // Сбрасываем выбранный сорт
    setValue('varietyId', ''); // Сбрасываем выбранный сорт
    setVarietySearch(''); // Сбрасываем поиск сортов
  };

  const handleVarietyChange = (value: string) => {
    setSelectedVarietyId(value);
    setValue('varietyId', value);
  };

  const handleShelfToggle = (shelfId: string) => {
    setSelectedShelfIds(prev => {
      if (prev.includes(shelfId)) {
        return prev.filter(id => id !== shelfId);
      } else {
        return [...prev, shelfId];
      }
    });
  };

  const getDisplayName = (nameRu: string, nameEn: string) => {
    return `${nameRu} / ${nameEn}`;
  };

  const genusOptions = genuses.map((genus) => ({
    value: genus._id,
    label: getDisplayName(genus.nameRu, genus.nameEn),
  }));

  const varietyOptions = varieties.map((variety) => ({
    value: variety._id,
    label: getDisplayName(variety.nameRu, variety.nameEn),
  }));

  const shelfOptions = shelves.map((shelf) => ({
    value: shelf._id,
    label: shelf.name,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать растение</DialogTitle>
          <DialogDescription>
            Обновите информацию о вашем растении
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Род растения */}
            <div className="grid gap-2">
              <Label htmlFor="genusId">
                Род растения <span className="text-destructive">*</span>
              </Label>
              <ComboBox
                options={genusOptions}
                value={selectedGenusId}
                onValueChange={handleGenusChange}
                placeholder="Выберите род растения"
                searchPlaceholder="Поиск рода..."
                emptyText="Ничего не найдено"
                isLoading={isLoadingGenuses}
                onSearchChange={setGenusSearch}
              />
              {errors.genusId && (
                <p className="text-sm text-destructive">Это поле обязательно</p>
              )}
            </div>

            {/* Сорт растения */}
            <div className="grid gap-2">
              <Label htmlFor="varietyId">Сорт растения </Label>
              <ComboBox
                options={varietyOptions}
                value={selectedVarietyId}
                onValueChange={handleVarietyChange}
                placeholder={
                  !selectedGenusId
                    ? 'Сначала выберите род'
                    : 'Выберите сорт'
                }
                searchPlaceholder="Поиск сорта..."
                emptyText={varietySearch ? 'Ничего не найдено' : 'Нет доступных сортов'}
                isLoading={isLoadingVarieties}
                disabled={!selectedGenusId}
                onSearchChange={setVarietySearch}
              />
            </div>

            {/* Полки */}
            <div className="grid gap-2">
              <Label>Полки</Label>
              {isLoadingShelves ? (
                <div className="text-sm text-muted-foreground">Загрузка полок...</div>
              ) : shelves.length === 0 ? (
                <div className="text-sm text-muted-foreground">Нет доступных полок</div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {shelves.map((shelf) => (
                    <div key={shelf._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`shelf-${shelf._id}`}
                        checked={selectedShelfIds.includes(shelf._id)}
                        onCheckedChange={() => handleShelfToggle(shelf._id)}
                      />
                      <label
                        htmlFor={`shelf-${shelf._id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {shelf.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {selectedShelfIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Выбрано полок: {selectedShelfIds.length}
                </div>
              )}
            </div>

            {/* Дата покупки */}
            <div className="grid gap-2">
              <Label htmlFor="purchaseDate">Дата покупки</Label>
              <DatePicker
                date={purchaseDate}
                onDateChange={setPurchaseDate}
                placeholder="Выберите дату покупки"
              />
            </div>

            {/* Фото растения */}
            <div className="grid gap-2">
              <Label htmlFor="photo">Фото растения</Label>
              <FileInput
                id="photo"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onFileChange={handleFileChange}
                preview={photoPreview}
                onRemove={handleRemovePhoto}
                maxSize={5 * 1024 * 1024}
                acceptedFormats={['JPG', 'PNG', 'GIF', 'WebP']}
              />
            </div>

            {/* Описание */}
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Добавьте описание вашего растения..."
                {...register('description')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading || !selectedGenusId}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
