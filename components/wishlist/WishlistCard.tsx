'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wishlist, getWishlistPhotoUrl, wishlistApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { getDisplayName } from '@/lib/utils/language';
import { Leaf, MoreHorizontal, Pencil, Trash2, Info, FileText } from 'lucide-react';
import { EditWishlistModal } from './EditWishlistModal';
import { PhotoGallery } from '@/components/plants/PhotoGallery';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

interface WishlistCardProps {
  wishlistItem: Wishlist;
  onUpdate: () => void;
}


export function WishlistCard({ wishlistItem, onUpdate }: WishlistCardProps) {
  const t = useTranslations('WishlistCard');
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const genus = typeof wishlistItem.genusId === 'object' ? wishlistItem.genusId : null;
  const variety = typeof wishlistItem.varietyId === 'object' ? wishlistItem.varietyId : null;

  const genusName = getDisplayName(genus, language);
  const varietyName = getDisplayName(variety, language);

  const photoUrl = getWishlistPhotoUrl(wishlistItem.photo);

  const note = wishlistItem.note;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await wishlistApi.delete(wishlistItem._id);
      trackEvent('wishlist_item_deleted');
      toast.success(t('success'));
      onUpdate();
    } catch (error) {
      toast.error(t('error'));
      console.error('Failed to delete wishlist item:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Note shown only when there's no variety
  const noteDisplay = !varietyName && note ? (
    <p className="text-xs text-muted-foreground">{note}</p>
  ) : null;

  return (
    <>
      <div className="group">
        {/* Photo */}
        <div
          className={`aspect-square relative bg-background rounded-lg overflow-hidden mb-3 shadow-sm${photoUrl ? ' cursor-pointer' : ''}`}
          onClick={() => photoUrl && setIsPhotoDialogOpen(true)}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={genusName || t('noName')}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <Leaf className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}

          {/* ⋯ context menu button */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <PopoverTrigger asChild>
                <button
                  className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t('menuLabel')}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-44 p-1"
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsInfoOpen(true);
                  }}
                >
                  <Info className="w-4 h-4" />
                  {t('info')}
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditModalOpen(true);
                    trackEvent('wishlist_edit_modal_opened');
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  {t('edit')}
                </button>
                <div className="h-px bg-border my-1" />
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsDeleteDialogOpen(true);
                    trackEvent('wishlist_delete_dialog_opened');
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  {t('delete')}
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-0.5 min-w-0 overflow-hidden">
          <h3 className="font-medium text-sm text-foreground/90 truncate">
            {genusName || t('noName')}
          </h3>
          {varietyName ? (
            <p className="text-xs text-muted-foreground truncate">{varietyName}</p>
          ) : (
            noteDisplay
          )}
        </div>
      </div>

      {/* Info dialog */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>{t('info')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{t('infoGenus')}</p>
                <p className="text-sm text-muted-foreground">{genusName || '—'}</p>
              </div>
            </div>
            {varietyName && (
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t('infoVariety')}</p>
                  <p className="text-sm text-muted-foreground">{varietyName}</p>
                </div>
              </div>
            )}
            {note && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t('infoNote')}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{note}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <EditWishlistModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={onUpdate}
        wishlistItem={wishlistItem}
      />

      {isPhotoDialogOpen && photoUrl && (
        <PhotoGallery
          photos={[photoUrl]}
          initialIndex={0}
          onClose={() => setIsPhotoDialogOpen(false)}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { name: genusName || t('noName') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('deleteLoading') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
