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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { Checkbox } from '@/components/ui/checkbox';
import { plantsApi, shelvesApi, Shelf } from '@/lib/api';
import { toast } from 'sonner';
import { PlantSelector } from './PlantSelector';

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
      toast.error('Ошибка загрузки полок');
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
      toast.success('Растение успешно добавлено!');
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
      toast.error('Ошибка при добавлении растения');
      console.error('Failed to create plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateFound = (date: Date | null) => {
    setPurchaseDate(date ?? new Date());
    if (date) {
      toast.info(`Дата покупки обновлена по данным фото: ${date.toLocaleDateString('ru-RU')}`);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPhotoPreview(null);
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

  const handleShelfToggle = (shelfId: string) => {
    setSelectedShelfIds(prev => {
      if (prev.includes(shelfId)) {
        return prev.filter(id => id !== shelfId);
      } else {
        return [...prev, shelfId];
      }
    });
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить растение</DialogTitle>
          <DialogDescription>
            Заполните информацию о вашем растении
          </DialogDescription>
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
              {isLoading ? 'Добавление...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
