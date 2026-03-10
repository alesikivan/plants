'use client';

import { useState } from 'react';
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
import { plantsApi, Plant } from '@/lib/api';
import { toast } from 'sonner';

interface DeletePlantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: Plant | null;
  onSuccess: () => void;
}

export function DeletePlantModal({ open, onOpenChange, plant, onSuccess }: DeletePlantModalProps) {
  const t = useTranslations('DeletePlantModal');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    if (!plant) return;

    setIsLoading(true);
    try {
      await plantsApi.delete(plant._id);
      toast.success(t('toasts.success'));
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(t('toasts.error'));
      console.error('Failed to delete plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!plant) return null;

  const plantName = plant.varietyId 
    ? (typeof plant.varietyId === 'object' 
        ? `${typeof plant.genusId === 'object' ? plant.genusId.nameRu : plant.genusId} ${plant.varietyId.nameRu}`
        : `Plant #${plant._id.slice(-4)}`)
    : (typeof plant.genusId === 'object' 
        ? plant.genusId.nameRu 
        : 'Plant');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription dangerouslySetInnerHTML={{ __html: t('description', { name: plantName }) }} />
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? t('buttons.deleting') : t('buttons.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
