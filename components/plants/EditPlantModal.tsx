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
import { MultiComboBox } from '@/components/ui/multi-combobox';
import { genusApi, varietyApi, plantsApi, shelvesApi, Genus, Variety, Plant, Shelf, getPlantPhotoUrl } from '@/lib/api';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';
import { CreateGenusModal } from './CreateGenusModal';
import { CreateVarietyModal } from './CreateVarietyModal';

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
  const [createGenusOpen, setCreateGenusOpen] = useState(false);
  const [createVarietyOpen, setCreateVarietyOpen] = useState(false);
  const [createGenusQuery, setCreateGenusQuery] = useState('');
  const [createVarietyQuery, setCreateVarietyQuery] = useState('');

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
        removeVariety: !selectedVarietyId,
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

    // Check file type
    if (!file.type.match(/image\/(jpg|jpeg|png|gif|webp|heic|heif)/)) {
      toast.error('Разрешены только изображения (JPG, JPEG, PNG, GIF, WebP, HEIC)');
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

  const handleDateFound = (date: Date | null) => {
    setPurchaseDate(date ?? new Date());
    if (date) {
      toast.info(`Дата покупки обновлена по данным фото: ${date.toLocaleDateString('ru-RU')}`);
    }
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

  const handleCreateNewGenus = (searchValue: string) => {
    setCreateGenusQuery(searchValue);
    setCreateGenusOpen(true);
  };

  const handleGenusCreated = (genus: Genus) => {
    setGenuses((prev) => [...prev, genus]);
    handleGenusChange(genus._id);
  };

  const handleCreateNewVariety = (searchValue: string) => {
    setCreateVarietyQuery(searchValue);
    setCreateVarietyOpen(true);
  };

  const handleVarietyCreated = (variety: Variety) => {
    setVarieties((prev) => [...prev, variety]);
    handleVarietyChange(variety._id);
  };

  const disableFutureDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
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

  return (
    <>
    <CreateGenusModal
      open={createGenusOpen}
      onOpenChange={setCreateGenusOpen}
      initialQuery={createGenusQuery}
      onCreated={handleGenusCreated}
    />
    <CreateVarietyModal
      open={createVarietyOpen}
      onOpenChange={setCreateVarietyOpen}
      initialQuery={createVarietyQuery}
      genusId={selectedGenusId}
      onCreated={handleVarietyCreated}
    />
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
                onCreateNew={handleCreateNewGenus}
                createNewLabel="Создать род"
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
                onCreateNew={selectedGenusId ? handleCreateNewVariety : undefined}
                createNewLabel="Создать сорт"
              />
            </div>

            {/* Полки */}
            <div className="grid gap-2">
              <Label>Полки</Label>
              <MultiComboBox
                options={shelves.map((s) => ({ value: s._id, label: s.name }))}
                values={selectedShelfIds}
                onValuesChange={setSelectedShelfIds}
                placeholder="Выберите полки..."
                searchPlaceholder="Поиск полки..."
                emptyText="Нет доступных полок"
                isLoading={isLoadingShelves}
              />
            </div>

            {/* Дата покупки */}
            <div className="grid gap-2">
              <Label htmlFor="purchaseDate">Дата покупки</Label>
              <DatePicker
                date={purchaseDate}
                onDateChange={setPurchaseDate}
                placeholder="Выберите дату покупки"
                disabledMatcher={disableFutureDates}
              />
            </div>

            {/* Фото растения */}
            <div className="grid gap-2">
              <Label htmlFor="photo">Фото растения</Label>
              <FileInput
                id="photo"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
                onFileChange={handleFileChange}
                onDateFound={handleDateFound}
                preview={photoPreview}
                onRemove={handleRemovePhoto}
                maxSize={5 * 1024 * 1024}
                acceptedFormats={['JPG', 'PNG', 'GIF', 'WebP', 'HEIC']}
                disableDateDetection={true}
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
    </>
  );
}
