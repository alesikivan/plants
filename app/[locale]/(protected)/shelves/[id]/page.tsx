'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Layers, Trash2, Pencil, Leaf, Copy, Check } from 'lucide-react';
import { shelvesApi, Shelf, getShelfPhotoUrl, getPlantPhotoUrl } from '@/lib/api';
import { toast } from 'sonner';
import { AddShelfModal, ManagePlantsModal } from '@/components/shelves';
import { PlantCard } from '@/components/plants/PlantCard';
import { PhotoGallery } from '@/components/plants/PhotoGallery';
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

export default function ShelfDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('ShelfDetailPage');
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManagePlantsModalOpen, setIsManagePlantsModalOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadShelf(params.id as string);
    }
  }, [params.id]);

  const loadShelf = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await shelvesApi.getOne(id);
      setShelf(data);
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error('Failed to load shelf:', error);
      router.push('/shelves');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!shelf) return;

    setIsDeleting(true);
    try {
      await shelvesApi.delete(shelf._id);
      toast.success(t('toasts.deleteSuccess'));
      router.push('/shelves');
    } catch (error) {
      toast.error(t('toasts.deleteError'));
      console.error('Failed to delete shelf:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    if (params.id) {
      loadShelf(params.id as string);
    }
  };

  const handleCopyPublicLink = async () => {
    if (!shelf) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const publicUrl = `${baseUrl}/profile/${shelf.userId}/shelves/${shelf._id}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setIsLinkCopied(true);
      toast.success(t('toasts.linkCopied'));
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (error) {
      toast.error(t('toasts.linkCopyError'));
      console.error('Failed to copy link:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <Layers className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!shelf) {
    return null;
  }

  const photoUrl = getShelfPhotoUrl(shelf.photo);
  const plants = shelf.plants || [];
  const plantPhotos = plants
    .map(plant => getPlantPhotoUrl(plant.photo))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-500 overflow-x-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/shelves')}
          className="gap-2 transition-all active:scale-95 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t('header.backButton')}</span>
        </Button>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCopyPublicLink}
            className="gap-2 transition-all active:scale-95"
            title={t('buttons.copyLink')}
          >
            {isLinkCopied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isLinkCopied ? t('buttons.linkCopied') : t('buttons.copyLink')}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-2 transition-all active:scale-95"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">{t('buttons.edit')}</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-all active:scale-95">
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('buttons.delete')}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteDialog.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="transition-all active:scale-95">{t('deleteDialog.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all active:scale-95"
                >
                  {isDeleting ? t('deleteDialog.deleting') : t('deleteDialog.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Edit Modal */}
      {shelf && (
        <AddShelfModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleEditSuccess}
          editShelf={{
            _id: shelf._id,
            name: shelf.name,
            photo: shelf.photo,
            plants: shelf.plants,
          }}
        />
      )}

      {/* Photo Gallery */}
      {isPhotoGalleryOpen && photoUrl && (
        <PhotoGallery
          photos={[photoUrl]}
          initialIndex={0}
          onClose={() => setIsPhotoGalleryOpen(false)}
        />
      )}

      {/* Shelf Info */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            {/* Photo */}
            <div className="shrink-0 w-32">
              <div className="relative bg-background rounded-lg overflow-hidden shadow-sm h-32 border">
                {photoUrl ? (
                  <button
                    onClick={() => setIsPhotoGalleryOpen(true)}
                    className="w-full h-full group"
                  >
                    <img
                      src={photoUrl}
                      alt={shelf.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    />
                  </button>
                ) : plantPhotos.length > 0 ? (
                  <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-muted/5 to-muted/20">
                    <div className="relative w-full h-full">
                      {plantPhotos.map((photoUrl, idx) => {
                        const totalCards = plantPhotos.length;
                        const rotationAngle = totalCards === 1 ? 0 :
                          totalCards === 2 ? (idx === 0 ? -12 : 12) :
                          (idx - 1) * 15;

                        const horizontalOffset = totalCards === 1 ? 50 :
                          totalCards === 2 ? (idx === 0 ? 35 : 65) :
                          [30, 50, 70][idx];

                        const verticalOffset = totalCards === 1 ? 50 :
                          Math.abs(idx - (totalCards - 1) / 2) * 8 + 45;

                        return (
                          <div
                            key={idx}
                            className="absolute rounded-lg overflow-hidden shadow-xl border-4 border-white"
                            style={{
                              width: '55%',
                              height: '75%',
                              left: `${horizontalOffset}%`,
                              top: `${verticalOffset}%`,
                              transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)`,
                              zIndex: totalCards === 3 && idx === 1 ? 10 : totalCards - idx,
                            }}
                          >
                            <img
                              src={photoUrl}
                              alt={`Plant ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/20">
                    <Layers className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}

                {plants.length > 0 && (
                  <div style={{zIndex: 10}} className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 shadow-sm">
                    <Leaf className="w-3 h-3" />
                    {plants.length}
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{t('info.nameLabel')}</p>
                  <p className="text-sm text-muted-foreground">{shelf.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{t('info.plantsCountLabel')}</p>
                  <p className="text-sm text-muted-foreground">{plants.length}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manage Plants Modal */}
      {shelf && (
        <ManagePlantsModal
          open={isManagePlantsModalOpen}
          onOpenChange={setIsManagePlantsModalOpen}
          onSuccess={handleEditSuccess}
          shelf={{
            _id: shelf._id,
            name: shelf.name,
            plants: shelf.plants,
          }}
        />
      )}

      {/* Plants on Shelf */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>{t('plants.title')}</CardTitle>
              <CardDescription>
                {plants.length > 0
                  ? t('plants.description')
                  : t('plants.empty')}
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsManagePlantsModalOpen(true)}
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              <Leaf className="w-4 h-4" />
              {t('plants.manageButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plants.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {plants.map((plant, index) => (
                <PlantCard key={plant._id} plant={plant} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Leaf className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('plants.emptyState.title')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {t('plants.emptyState.description')}
              </p>
              <Button onClick={() => router.push('/plants')} className="gap-2">
                <Leaf className="w-4 h-4" />
                {t('plants.emptyState.button')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
