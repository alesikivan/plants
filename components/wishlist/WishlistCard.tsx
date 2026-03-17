'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Wishlist, Genus, Variety, getWishlistPhotoUrl, wishlistApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { getDisplayName } from '@/lib/utils/language';
import { Leaf, Edit, Trash2, Eye } from 'lucide-react';
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
  const [isDeleting, setIsDeleting] = useState(false);

  const genus = typeof wishlistItem.genusId === 'object' ? wishlistItem.genusId : null;
  const variety = typeof wishlistItem.varietyId === 'object' ? wishlistItem.varietyId : null;

  const genusName = getDisplayName(genus, language);
  const varietyName = getDisplayName(variety, language);

  const photoUrl = getWishlistPhotoUrl(wishlistItem.photo);

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

  return (
    <>
      <div className="group">
        <div className="aspect-square relative bg-background rounded-lg overflow-hidden mb-3 shadow-sm">
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

          {/* Action buttons overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-1">
            {photoUrl && (
              <Button
                size="icon"
                onClick={() => setIsPhotoDialogOpen(true)}
                className="w-12 h-12 rounded-full bg-white text-black hover:bg-white/90 transition-all hover:scale-110 active:scale-95"
              >
                <Eye className="w-6 h-6" />
              </Button>
            )}
            <Button
              size="icon"
              onClick={() => { setIsEditModalOpen(true); trackEvent('wishlist_edit_modal_opened'); }}
              className="w-12 h-12 rounded-full bg-white text-black hover:bg-white/90 transition-all hover:scale-110 active:scale-95"
            >
              <Edit className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              onClick={() => { setIsDeleteDialogOpen(true); trackEvent('wishlist_delete_dialog_opened'); }}
              className="w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all hover:scale-110 active:scale-95"
            >
              <Trash2 className="w-6 h-6" />
            </Button>
          </div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-medium text-sm text-foreground/90">
            {genusName || t('noName')}
          </h3>
          {varietyName && (
            <p className="text-xs text-muted-foreground">
              {varietyName}
            </p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditWishlistModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={onUpdate}
        wishlistItem={wishlistItem}
      />

      {/* Photo Gallery */}
      {isPhotoDialogOpen && photoUrl && (
        <PhotoGallery
          photos={[photoUrl]}
          initialIndex={0}
          onClose={() => setIsPhotoDialogOpen(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
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
