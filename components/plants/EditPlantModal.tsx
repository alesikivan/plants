'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { MultiComboBox } from '@/components/ui/multi-combobox';
import { plantsApi, Plant, shelvesApi, Shelf } from '@/lib/api';
import { toast } from 'sonner';
import { PlantSelector } from './PlantSelector';

interface EditPlantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: Plant | null;
  onSuccess: () => void;
}

interface PlantFormData {
  genusId: string;
  varietyId?: string;
  shelfIds?: string[];
  purchaseDate?: Date;
  photo?: FileList;
  description?: string;
}

export function EditPlantModal({ open, onOpenChange, plant, onSuccess }: EditPlantModalProps) {
  const t = useTranslations('EditPlantModal');
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedGenusId, setSelectedGenusId] = useState<string>('');
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShelves, setIsLoadingShelves] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlantFormData>();

  // Инициализация формы при открытии модального окна
  useEffect(() => {
    if (open && plant) {
      setSelectedGenusId(typeof plant.genusId === 'object' ? plant.genusId._id : plant.genusId);
      setSelectedVarietyId(typeof plant.varietyId === 'object' ? plant.varietyId?._id || '' : plant.varietyId || '');
      setSelectedShelfIds(plant.shelfIds || []);
      setPurchaseDate(plant.purchaseDate ? new Date(plant.purchaseDate) : new Date());
      if (plant.photo) {
        setPhotoPreview(plant.photo);
      }
      loadShelves();
    }
  }, [open, plant]);

  // Сброс состояния при закрытии модального окна
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedGenusId('');
      setSelectedVarietyId('');
      setSelectedShelfIds([]);
      setPurchaseDate(new Date());
      setPhotoPreview(null);
      setSelectedFile(null);
    }
  }, [open, reset]);

  const loadShelves = async () => {
    setIsLoadingShelves(true);
    try {
      const data = await shelvesApi.getAll();
      setShelves(data);
    } catch (error) {
      toast.error(t('toasts.shelvesError'));
      console.error('Failed to load shelves:', error);
    } finally {
      setIsLoadingShelves(false);
    }
  };

  const onSubmit = async (data: PlantFormData) => {
    if (!plant) return;

    setIsLoading(true);
    try {
      await plantsApi.update(plant._id, {
        genusId: selectedGenusId,
        varietyId: selectedVarietyId || undefined,
        shelfIds: selectedShelfIds.length > 0 ? selectedShelfIds : undefined,
        purchaseDate: purchaseDate ? purchaseDate.toISOString() : undefined,
        photo: selectedFile || undefined,
        description: data.description || undefined,
      });
      toast.success(t('toasts.success'));
      reset();
      setSelectedGenusId('');
      setSelectedVarietyId('');
      setSelectedShelfIds([]);
      setPurchaseDate(new Date());
      setPhotoPreview(null);
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(t('toasts.error'));
      console.error('Failed to update plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

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
  };

  const handleGenusChange = (genusId: string) => {
    setSelectedGenusId(genusId);
    setValue('genusId', genusId);
    setSelectedVarietyId('');
    setValue('varietyId', '');
  };

  const handleVarietyChange = (varietyId: string) => {
    setSelectedVarietyId(varietyId);
    setValue('varietyId', varietyId);
  };

  const disableFutureDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  if (!plant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Род и сорт растения */}
            <PlantSelector
              selectedGenusId={selectedGenusId}
              selectedVarietyId={selectedVarietyId}
              onGenusChange={handleGenusChange}
              onVarietyChange={handleVarietyChange}
              allowCreate
              required
              genusError={!!errors.genusId}
            />

            {/* Полки */}
            <div className="grid gap-2">
              <Label>{t('shelves')}</Label>
              <MultiComboBox
                options={shelves.map((s) => ({ value: s._id, label: s.name }))}
                values={selectedShelfIds}
                onValuesChange={setSelectedShelfIds}
                placeholder={t('shelvesPlaceholder')}
                searchPlaceholder={t('shelvesSearchPlaceholder')}
                emptyText={t('shelvesEmpty')}
                isLoading={isLoadingShelves}
              />
            </div>

            {/* Дата покупки */}
            <div className="grid gap-2">
              <Label htmlFor="purchaseDate">{t('purchaseDate')}</Label>
              <DatePicker
                date={purchaseDate}
                onDateChange={setPurchaseDate}
                placeholder={t('purchaseDatePlaceholder')}
                disabledMatcher={disableFutureDates}
              />
            </div>

            {/* Фото растения */}
            <div className="grid gap-2">
              <Label htmlFor="photo">{t('photo')}</Label>
              <FileInput
                id="photo"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
                onFileChange={handleFileChange}
                preview={photoPreview}
                onRemove={handleRemovePhoto}
                maxSize={5 * 1024 * 1024}
                acceptedFormats={['JPG', 'PNG', 'GIF', 'WebP', 'HEIC']}
              />
            </div>

            {/* Описание */}
            <div className="grid gap-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                placeholder={t('descriptionPlaceholder')}
                {...register('description')}
                rows={3}
                defaultValue={plant.description || ''}
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
              {t('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !selectedGenusId}>
              {isLoading ? t('buttons.saving') : t('buttons.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
