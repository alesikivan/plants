'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations, useLocale } from 'next-intl';
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
import { plantsApi, shelvesApi, Shelf } from '@/lib/api';
import { toast } from 'sonner';
import { PlantSelector } from './PlantSelector';
import { trackEvent } from '@/lib/analytics';

interface AddPlantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddPlantModal({ open, onOpenChange, onSuccess }: AddPlantModalProps) {
  const t = useTranslations('AddPlantModal');
  const locale = useLocale();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [selectedGenusId, setSelectedGenusId] = useState<string>('');
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShelves, setIsLoadingShelves] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PlantFormData>();
  const description = watch('description') ?? '';

  useEffect(() => {
    if (open) {
      trackEvent('plant_add_modal_opened');
    }
  }, [open]);

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
  }, [open]);

  // Загрузка полок при открытии модального окна
  useEffect(() => {
    if (open) {
      loadShelves();
    }
  }, [open]);

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
    setIsLoading(true);
    try {
      await plantsApi.create({
        genusId: data.genusId,
        varietyId: data.varietyId || undefined,
        shelfIds: selectedShelfIds.length > 0 ? selectedShelfIds : undefined,
        purchaseDate: purchaseDate ? purchaseDate.toISOString() : undefined,
        photo: selectedFile || undefined,
        description: data.description || undefined,
      });
      trackEvent('plant_created', {
        has_photo: !!selectedFile,
        has_variety: !!data.varietyId,
        has_shelves: selectedShelfIds.length > 0,
        has_description: !!(data.description),
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
      console.error('Failed to create plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateFound = (date: Date | null) => {
    setPurchaseDate(date ?? new Date());
    if (date) {
      const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US';
      toast.info(t('toasts.dateFound', { date: date.toLocaleDateString(dateLocale) }));
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPhotoPreview(null);
      return;
    }

    trackEvent('plant_photo_selected', { modal: 'add' });
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    trackEvent('plant_photo_removed', { modal: 'add' });
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

  return (
    <>
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
                onDateFound={handleDateFound}
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
                {...register('description', { maxLength: 600 })}
                rows={3}
              />
              <p className={`text-xs text-right ${description.length >= 600 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {description.length}/600{description.length >= 600 && ` — ${t('descriptionMaxLength')}`}
              </p>
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
              {isLoading ? t('buttons.adding') : t('buttons.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
