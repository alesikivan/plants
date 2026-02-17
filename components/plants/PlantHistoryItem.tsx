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

  return (
    <>
      <div className="relative flex gap-4">
        {/* Timeline line and dot */}
        <div className="relative flex flex-col items-center">
          {/* Dot */}
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center z-10 shadow-lg">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          {/* Vertical line */}
          {!isLast && (
            <div className="absolute top-10 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-border" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          {/* Date badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
            {new Date(historyItem.date).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          {/* Card */}
          <Card className="p-4 transition-all hover:shadow-lg border-l-4 border-l-primary/30 hover:border-l-primary">
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="text-sm whitespace-pre-wrap flex-1 leading-relaxed">
                {historyItem.comment}
              </p>

              <div className="flex gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="transition-all hover:scale-110 active:scale-95"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive transition-all hover:scale-110 active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
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

            {historyItem.photos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{historyItem.photos.length} {historyItem.photos.length === 1 ? 'фото' : 'фотографии'}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {historyItem.photos.map((photo, index) => (
                    <button
                      key={photo}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 transition-all hover:scale-105 hover:shadow-md active:scale-95 group"
                    >
                      <img
                        src={getPlantHistoryPhotoUrl(photo)}
                        alt={`Фото ${index + 1}`}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
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
