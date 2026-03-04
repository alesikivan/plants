'use client';

import { useState } from 'react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleDateFound = (date: Date | null) => {
    setDate(date ?? new Date());
    if (date) {
      toast.info(`Дата обновлена по данным фото: ${date.toLocaleDateString('ru-RU')}`);
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
      toast.error('Выберите дату');
      return;
    }

    const hasPhotos = photos.length > 0;
    const hasComment = comment.trim().length > 0;

    if (!hasComment && !hasPhotos) {
      toast.error('Добавьте комментарий или фотографии');
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
      toast.success('Запись добавлена');
      onSuccess();
      onOpenChange(false);
      // Reset form
      setDate(new Date());
      setComment('');
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      toast.error('Ошибка при добавлении записи');
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
            Добавить запись в историю
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Дата</Label>
            <DatePicker
              date={date}
              onDateChange={setDate}
              placeholder="Выберите дату события"
              disabledMatcher={disableFutureDates}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              placeholder="Опишите, что произошло с растением..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photos">Фотографии</Label>
            <MultiFileInput
              id="photos"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
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
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!comment.trim() && photos.length === 0)}
            >
              {isSubmitting ? 'Добавление...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
