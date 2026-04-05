'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MoreVertical, AlertCircle, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { wishlistApi } from '@/lib/api/wishlist';
import { FeedPlantItem } from '@/lib/api/feed';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

async function copyPhotoToFile(photoUrl: string, filename: string): Promise<File | null> {
  try {
    const response = await fetch(photoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  } catch {
    return null;
  }
}

interface PlantCardMenuProps {
  item: FeedPlantItem;
}

export function PlantCardMenu({ item }: PlantCardMenuProps) {
  const t = useTranslations('PlantCardMenu');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getGenusId = () => {
    return typeof item.plant.genusId === 'string'
      ? item.plant.genusId
      : item.plant.genusId._id;
  };

  const getVarietyId = () => {
    return item.plant.varietyId
      ? typeof item.plant.varietyId === 'string'
        ? item.plant.varietyId
        : item.plant.varietyId._id
      : undefined;
  };

  const checkAndAddToWishlist = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const genusId = getGenusId();
      const varietyId = getVarietyId();

      // Check if already exists
      const existing = await wishlistApi.getAll({ genusId, varietyId });

      if (existing.length > 0) {
        // Show confirmation dialog
        setShowConfirm(true);
        setIsLoading(false);
        return;
      }

      // No existing item, add directly
      await addToWishlist();
    } catch (error) {
      toast.error(t('error'));
      setIsLoading(false);
    }
  };

  const addToWishlist = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Get plant photo URL
      const photoUrl = item.plant.photo
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api'}/plants/photo/${item.plant.photo}`
        : null;

      let photoFile: File | null = null;
      if (photoUrl) {
        photoFile = await copyPhotoToFile(photoUrl, `wishlist_${item.plant._id}_${Date.now()}.jpg`);
      }

      // Create wishlist entry
      await wishlistApi.create({
        genusId: getGenusId(),
        varietyId: getVarietyId(),
        photo: photoFile || undefined,
        sourceUserId: item.user._id,
        sourceUsername: item.user.name,
      });

      toast.success(t('success'));
      setIsOpen(false);
      setShowConfirm(false);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        aria-label={t('menuAlt')}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-max">
          <button
            onClick={(e) => {
              e.stopPropagation();
              checkAndAddToWishlist();
            }}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-accent transition-colors rounded-lg first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                {t('loading')}
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                {t('addToWishlist')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            {t('confirmTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('confirmDescription')}</AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>{t('confirmCancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => addToWishlist()}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              ) : null}
              {t('confirmAdd')}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
