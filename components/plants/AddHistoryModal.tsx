'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiFileInput } from '@/components/ui/multi-file-input';
import { Calendar, Send } from 'lucide-react';
import { plantHistoryApi, CreatePlantHistoryDto } from '@/lib/api';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/lib/store/authStore';

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
  const telegramPublishEnabled = useAuthStore(
    (state) => !!state.user?.telegramPublishHistory && (state.user?.showPlants ?? true) && (state.user?.showPlantHistory ?? true),
  );
  const [publishToTelegram, setPublishToTelegram] = useState(true);

  useEffect(() => {
    if (!open) {
      photoPreviews.forEach(url => URL.revokeObjectURL(url));
      setDate(new Date());
      setComment('');
      setPhotos([]);
      setPhotoPreviews([]);
      setPublishToTelegram(true);
    }
  }, [open]);

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

    if (comment.length > 600) {
      toast.error(t('commentMaxLength'));
      return;
    }

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
        publishToTelegram: telegramPublishEnabled ? publishToTelegram : undefined,
      };

      await plantHistoryApi.create(plantId, historyData);
      toast.success(t('toasts.success'));
      onSuccess();
      onOpenChange(false);
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
            <p className={`text-xs text-right ${comment.length >= 600 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {comment.length}/600{comment.length >= 600 && ` — ${t('commentMaxLength')}`}
            </p>
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
              maxFiles={3}
            />
          </div>

          {/* Публикация в Telegram-сообщество (только если включена автопубликация) */}
          {telegramPublishEnabled && (
            <div
              className={`rounded-lg border-2 p-3 transition-all ${
                publishToTelegram
                  ? 'border-primary bg-primary/5'
                  : 'border-dashed border-muted-foreground/30 hover:border-muted-foreground/60'
              }`}
            >
              <label htmlFor="historyPublishToTelegram" className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  id="historyPublishToTelegram"
                  checked={publishToTelegram}
                  onCheckedChange={(checked) => setPublishToTelegram(!!checked)}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-primary" />
                    {t('publishToTelegram')}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {t('publishToTelegramHint')}
                  </span>
                </div>
              </label>
            </div>
          )}

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
