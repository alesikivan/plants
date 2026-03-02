'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiFileInput } from '@/components/ui/multi-file-input';
import { Calendar, X } from 'lucide-react';
import { plantHistoryApi, UpdatePlantHistoryDto, PlantHistory, getPlantHistoryPhotoUrl } from '@/lib/api';
import { toast } from 'sonner';

interface EditHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  plantId: string;
  historyItem: PlantHistory;
}

export function EditHistoryModal({
  open,
  onOpenChange,
  onSuccess,
  plantId,
  historyItem,
}: EditHistoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [comment, setComment] = useState('');
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [removePhotos, setRemovePhotos] = useState<string[]>([]);

  useEffect(() => {
    if (open && historyItem) {
      setDate(new Date(historyItem.date));
      setComment(historyItem.comment);
      setExistingPhotos(historyItem.photos);
      setNewPhotos([]);
      setNewPhotoPreviews([]);
      setRemovePhotos([]);
    }
  }, [open, historyItem]);

  const handleNewPhotosChange = (files: File[]) => {
    // Check file type for each file
    const validFiles = files.filter(file => {
      if (!file.type.match(/image\/(jpg|jpeg|png|gif|webp)/)) {
        toast.error(`Файл ${file.name} не является изображением`);
        return false;
      }
      return true;
    });

    setNewPhotos(validFiles);

    // Create previews
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setNewPhotoPreviews(previews);
  };

  const handleRemoveExistingPhoto = (photo: string) => {
    setExistingPhotos(existingPhotos.filter(p => p !== photo));
    setRemovePhotos([...removePhotos, photo]);
  };

  const handleRemoveNewPhoto = (index: number) => {
    const newPhotosList = newPhotos.filter((_, i) => i !== index);
    setNewPhotos(newPhotosList);

    const newPreviews = newPhotoPreviews.filter((_, i) => i !== index);
    // Clean up old preview URL
    URL.revokeObjectURL(newPhotoPreviews[index]);
    setNewPhotoPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error('Выберите дату');
      return;
    }

    const hasPhotos = existingPhotos.length > 0 || newPhotos.length > 0;
    const hasComment = comment.trim().length > 0;

    if (!hasComment && !hasPhotos) {
      toast.error('Добавьте комментарий или фотографии');
      return;
    }

    setIsSubmitting(true);
    try {
      await plantHistoryApi.update(plantId, historyItem._id, {
        date: date.toISOString(),
        comment,
        photos: newPhotos.length > 0 ? newPhotos : undefined,
        removePhotos: removePhotos.length > 0 ? removePhotos : undefined,
      });
      toast.success('Запись обновлена');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Ошибка при обновлении записи');
      console.error('Failed to update history:', error);
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
            Редактировать запись
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Дата</Label>
            <DatePicker
              date={date}
              onDateChange={setDate}
              placeholder="Выберите дату события"
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

          {existingPhotos.length > 0 && (
            <div className="grid gap-2">
              <Label>Текущие фотографии</Label>
              <div className="grid grid-cols-3 gap-3">
                {existingPhotos.map((photo) => (
                  <div key={photo} className="relative rounded-xl border-2 border-input overflow-hidden group">
                    <img
                      src={getPlantHistoryPhotoUrl(photo)}
                      alt="Existing"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(photo)}
                      className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive hover:scale-110 active:scale-95 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="photos">Добавить новые фотографии</Label>
            <MultiFileInput
              id="photos"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onFilesChange={handleNewPhotosChange}
              previews={newPhotoPreviews}
              onRemove={handleRemoveNewPhoto}
              maxSize={5 * 1024 * 1024}
              acceptedFormats={['JPG', 'PNG', 'GIF', 'WebP']}
              maxFiles={10}
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
              disabled={isSubmitting || (!comment.trim() && existingPhotos.length === 0 && newPhotos.length === 0)}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
