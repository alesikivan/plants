'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Pencil, Trash2, Camera } from 'lucide-react';
import { PlantHistory, getPlantHistoryPhotoUrl } from '@/lib/api';
import { EditHistoryModal } from './EditHistoryModal';
import { PhotoGallery } from './PhotoGallery';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PlantHistoryItemProps {
  historyItem: PlantHistory;
  plantId: string;
  onEditSuccess: () => void;
  onDelete: () => void;
  isLast?: boolean;
}

export function PlantHistoryItem({
  historyItem,
  plantId,
  onEditSuccess,
  onDelete,
  isLast = false,
}: PlantHistoryItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const photoUrls = historyItem.photos.map(photo => getPlantHistoryPhotoUrl(photo)!);

  const formattedDate = new Date(historyItem.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div className="relative flex gap-3 group">
        {/* Timeline line and icon */}
        <div className="relative flex flex-col items-center pt-1">
          {/* Icon circle */}
          <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center z-10 flex-shrink-0">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          {/* Vertical line */}
          {!isLast && (
            <div className="absolute top-11 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-border" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-8 pt-1">
          {/* Date at top */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {formattedDate}
            </span>
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="h-7 w-7 p-0 text-muted-foreground hover:bg-muted"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Запись и все её фотографии будут удалены.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="transition-all hover:scale-105 active:scale-95">
                      Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="transition-all hover:scale-105 active:scale-95"
                    >
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Comment */}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mb-3">
            {historyItem.comment}
          </p>

          {/* Photos grid with wrap */}
          {historyItem.photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {historyItem.photos.map((photo, index) => (
                <button
                  key={photo}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className="aspect-square rounded-lg overflow-hidden bg-muted transition-all hover:scale-105 hover:shadow-md active:scale-95"
                >
                  <img
                    src={getPlantHistoryPhotoUrl(photo)}
                    alt={`Фото ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditHistoryModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={onEditSuccess}
        plantId={plantId}
        historyItem={historyItem}
      />

      {selectedPhotoIndex !== null && (
        <PhotoGallery
          photos={photoUrls}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </>
  );
}
