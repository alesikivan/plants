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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ComboBox } from '@/components/ui/combobox';
import { FileInput } from '@/components/ui/file-input';
import { genusApi, varietyApi, wishlistApi, Genus, Variety, Wishlist, getWishlistPhotoUrl } from '@/lib/api';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';

interface EditWishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  wishlistItem: Wishlist;
}

interface WishlistFormData {
  genusId: string;
  varietyId?: string;
  photo?: FileList;
}

export function EditWishlistModal({ open, onOpenChange, onSuccess, wishlistItem }: EditWishlistModalProps) {
  const [genuses, setGenuses] = useState<Genus[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [selectedGenusId, setSelectedGenusId] = useState<string>('');
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
  const [genusSearch, setGenusSearch] = useState<string>('');
  const [varietySearch, setVarietySearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGenuses, setIsLoadingGenuses] = useState(false);
  const [isLoadingVarieties, setIsLoadingVarieties] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const debouncedGenusSearch = useDebounce(genusSearch, 300);
  const debouncedVarietySearch = useDebounce(varietySearch, 300);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<WishlistFormData>();

  // Initialize form with wishlist item data
  useEffect(() => {
    if (open && wishlistItem) {
      const genusId = typeof wishlistItem.genusId === 'object' ? wishlistItem.genusId._id : wishlistItem.genusId;
      const varietyId = typeof wishlistItem.varietyId === 'object' ? wishlistItem.varietyId?._id : wishlistItem.varietyId;

      setSelectedGenusId(genusId);
      setSelectedVarietyId(varietyId || '');
      setValue('genusId', genusId);
      setValue('varietyId', varietyId || '');

      if (wishlistItem.photo) {
        setPhotoPreview(getWishlistPhotoUrl(wishlistItem.photo) || null);
      }
    }
  }, [open, wishlistItem, setValue]);

  // Загрузка родов при открытии модального окна или изменении поиска
  useEffect(() => {
    if (open) {
      loadGenuses(debouncedGenusSearch);
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

  const onSubmit = async (data: WishlistFormData) => {
    setIsLoading(true);
    try {
      await wishlistApi.update(wishlistItem._id, {
        genusId: data.genusId,
        varietyId: data.varietyId || undefined,
        photo: selectedFile || undefined,
      });
      toast.success('Список желаний обновлен!');
      reset();
      setSelectedGenusId('');
      setSelectedVarietyId('');
      setGenusSearch('');
      setVarietySearch('');
      setPhotoPreview(null);
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error('Ошибка при обновлении списка желаний');
      console.error('Failed to update wishlist item:', error);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать список желаний</DialogTitle>
          <DialogDescription>
            Измените информацию о растении в списке желаний
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
              <Label htmlFor="varietyId">Сорт растения</Label>
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

            {/* Фото растения */}
            <div className="grid gap-2">
              <Label htmlFor="photo">Фото растения (необязательно)</Label>
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
