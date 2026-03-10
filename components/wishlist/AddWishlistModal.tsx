'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileInput } from '@/components/ui/file-input';
import { wishlistApi } from '@/lib/api';
import { toast } from 'sonner';
import { PlantSelector } from '@/components/plants/PlantSelector';

interface AddWishlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface WishlistFormData {
  genusId: string;
  varietyId?: string;
  photo?: FileList;
}

export function AddWishlistModal({ open, onOpenChange, onSuccess }: AddWishlistModalProps) {
  const t = useTranslations('AddWishlistModal');
  const [selectedGenusId, setSelectedGenusId] = useState<string>('');
  const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { handleSubmit, reset, setValue, formState: { errors } } = useForm<WishlistFormData>();

  const onSubmit = async (data: WishlistFormData) => {
    setIsLoading(true);
    try {
      await wishlistApi.create({
        genusId: data.genusId,
        varietyId: data.varietyId || undefined,
        photo: selectedFile || undefined,
      });
      toast.success(t('success'));
      reset();
      setSelectedGenusId('');
      setSelectedVarietyId('');
      setPhotoPreview(null);
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(t('error'));
      console.error('Failed to create wishlist item:', error);
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

    // Check file type
    if (!file.type.match(/image\/(jpg|jpeg|png|gif|webp)/)) {
      toast.error(t('invalidFileType'));
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
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

            {/* Фото растения */}
            <div className="grid gap-2">
              <Label htmlFor="photo">{t('photoLabel')}</Label>
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
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !selectedGenusId}>
              {isLoading ? t('submitLoading') : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
