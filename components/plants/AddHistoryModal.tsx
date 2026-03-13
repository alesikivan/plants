'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiFileInput } from '@/components/ui/multi-file-input';
import { Calendar } from 'lucide-react';
import { plantHistoryApi, CreatePlantHistoryDto } from '@/lib/api';
import { toast } from 'sonner';

interface AddHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  plantId: string;
}

export function AddHistoryModal({
  open,
  onOpenChange,
  onSuccess,
  plantId,
}: AddHistoryModalProps) {
  const t = useTranslations('AddHistoryModal');
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleDateFound = (date: Date | null) => {
    setDate(date ?? new Date());
    if (date) {
      toast.info(t('toasts.dateFound', { date: date.toLocaleDateString(locale) }));
    }
  };

  const handlePhotosChange = (files: File[]) => {
    setPhotos(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(previews);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);

    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    // Clean up old preview URL
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews(newPreviews);
  };

  const disableFutureDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error(t('dateLabel'));
      return;
    }

    const hasPhotos = photos.length > 0;
    const hasComment = comment.trim().length > 0;

    if (!hasComment && !hasPhotos) {
      toast.error(t('commentLabel'));
      return;
    }

    setIsSubmitting(true);
    try {
      const historyData: CreatePlantHistoryDto = {
        date: date.toISOString(),
        comment: comment.trim() || undefined,
        photos,
      };

      await plantHistoryApi.create(plantId, historyData);
      toast.success(t('toasts.success'));
      onSuccess();
      onOpenChange(false);
      // Reset form
      setDate(new Date());
      setComment('');
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      toast.error(t('toasts.error'));
      console.error('Failed to add history:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="date">{t('dateLabel')}</Label>
            <DatePicker
              date={date}
              onDateChange={setDate}
              placeholder={t('datePlaceholder')}
              disabledMatcher={disableFutureDates}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comment">{t('commentLabel')}</Label>
            <Textarea
              id="comment"
              placeholder={t('commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photos">{t('photosLabel')}</Label>
            <MultiFileInput
              id="photos"
              accept="image/*"
              onFilesChange={handlePhotosChange}
              onDateFound={handleDateFound}
              previews={photoPreviews}
              onRemove={handleRemovePhoto}
              maxSize={5 * 1024 * 1024}
              acceptedFormats={['JPG', 'PNG', 'GIF', 'WebP', 'HEIC']}
              maxFiles={5}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!comment.trim() && photos.length === 0)}
            >
              {isSubmitting ? t('buttons.adding') : t('buttons.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
