'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, EyeOff, Layers, Leaf, Copy, Check } from 'lucide-react';
import { usersApi, Shelf, getShelfPhotoUrl, getPlantPhotoUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { PlantCard } from '@/components/plants/PlantCard';
import { ShelfDiscoverBanner } from '@/components/public/ShelfDiscoverBanner';
import { toast } from 'sonner';

interface UserShelfDetailClientProps {
  initialShelf?: Shelf | null;
  initialHidden?: boolean;
}

export default function UserShelfDetailClient({
  initialShelf = null,
  initialHidden = false,
}: UserShelfDetailClientProps) {
  const t = useTranslations('UserShelfDetailPage');
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const shelfId = params.shelfId as string;
  const user = useAuthStore((state) => state.user);

  const [shelf, setShelf] = useState<Shelf | null>(initialShelf);
  const [isLoading, setIsLoading] = useState(!initialShelf && !initialHidden);
  const [isHidden, setIsHidden] = useState(initialHidden);
  const [isMounted, setIsMounted] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!userId || !shelfId) return;
    if (initialShelf || initialHidden) return;

    Promise.all([
      usersApi.getUserShelf(userId, shelfId),
      usersApi.getUserProfile(userId),
    ])
      .then(([shelfData, userData]) => {
        setShelf(shelfData);
        setOwner(userData);
      })
      .catch((error) => {
        if (error?.response?.status === 403) {
          setIsHidden(true);
          return;
        }
        toast.error(t('loadError'));
        router.back();
      })
      .finally(() => setIsLoading(false));
  }, [initialHidden, initialShelf, router, shelfId, userId]);

  const handleCopyShelfLink = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shelfUrl = `${baseUrl}/profile/${userId}/shelves/${shelfId}`;

    try {
      await navigator.clipboard.writeText(shelfUrl);
      setIsLinkCopied(true);
      toast.success(t('copyLinkSuccess'));

      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (error) {
      toast.error(t('copyLinkError'));
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

  if (isHidden) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
        {user && (
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Button>
        )}

        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <EyeOff className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h1 className="text-xl font-semibold mb-2">{t('shelfHidden.title')}</h1>
              <p className="text-muted-foreground">{t('shelfHidden.description')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shelf) return null;

  const photoUrl = getShelfPhotoUrl(shelf.photo);
  const plants = shelf.plants || [];
  const plantPhotos = plants.map(p => getPlantPhotoUrl(p.photo)).filter(Boolean).slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {user && (
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </Button>
      )}

      {/* Shelf Info */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-32">
              <div className="relative bg-background rounded-lg overflow-hidden shadow-sm h-32 border">
                {photoUrl ? (
                  <img src={photoUrl} alt={shelf.name} className="w-full h-full object-cover" />
                ) : plantPhotos.length > 0 ? (
                  <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-muted/5 to-muted/20">
                    <div className="relative w-full h-full">
                      {plantPhotos.map((pUrl, idx) => {
                        const total = plantPhotos.length;
                        const rot = total === 1 ? 0 : total === 2 ? (idx === 0 ? -12 : 12) : (idx - 1) * 15;
                        const hOff = total === 1 ? 50 : total === 2 ? (idx === 0 ? 35 : 65) : [30, 50, 70][idx];
                        const vOff = total === 1 ? 50 : Math.abs(idx - (total - 1) / 2) * 8 + 45;
                        return (
                          <div
                            key={idx}
                            className="absolute rounded-lg overflow-hidden shadow-xl border-4 border-white"
                            style={{
                              width: '55%', height: '75%',
                              left: `${hOff}%`, top: `${vOff}%`,
                              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                              zIndex: total === 3 && idx === 1 ? 10 : total - idx,
                            }}
                          >
                            <img src={pUrl} alt={`Plant ${idx + 1}`} className="w-full h-full object-cover" />
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
                  <div style={{ zIndex: 10 }} className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 shadow-sm">
                    <Leaf className="w-3 h-3" />
                    {plants.length}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('shelfInfo.nameLabel')}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{shelf.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyShelfLink}
                      className="h-6 px-2 gap-1 text-muted-foreground hover:text-foreground transition-all active:scale-95"
                      title={t('copyLinkTooltip')}
                    >
                      {isLinkCopied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{t('shelfInfo.plantsCountLabel')}</p>
                  <p className="text-sm text-muted-foreground">{plants.length}</p>
                </div>
              </div>

              {owner && (
                <div className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t('shelfInfo.ownerLabel')}</p>
                    <a
                      href={`/profile/${userId}`}
                      className="text-sm text-primary hover:underline transition-colors"
                    >
                      {owner.name}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discover Banner for unregistered users */}
      {isMounted && !user && <ShelfDiscoverBanner />}

      {/* Plants on Shelf */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>{t('plants.title')}</CardTitle>
          <CardDescription>
            {plants.length > 0 ? t('plants.description') : t('plants.empty')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plants.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {plants.map((plant, index) => (
                <PlantCard
                  key={plant._id}
                  plant={plant}
                  index={index}
                  href={`/profile/${userId}/plants/${plant._id}`}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Leaf className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{t('plants.empty')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
