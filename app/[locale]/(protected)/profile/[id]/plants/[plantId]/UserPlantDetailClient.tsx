'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calendar, EyeOff, FileText, Leaf, MessageSquare, Copy, Check, User, Bookmark } from 'lucide-react';
import { usersApi, Plant, PlantHistory, Genus, Variety, getPlantPhotoUrl, getPlantHistoryPhotoUrl } from '@/lib/api';
import { bookmarksApi } from '@/lib/api/bookmarks';
import { useAuthStore } from '@/lib/store/authStore';
import { getDisplayName } from '@/lib/utils/language';
import { toast } from 'sonner';
import { PhotoGallery } from '@/components/plants/PhotoGallery';
import { DiscoverBanner } from '@/components/public/DiscoverBanner';

interface UserPlantDetailClientProps {
  initialPlant?: Plant | null;
  initialHistory?: PlantHistory[];
  initialProfile?: any;
  initialPlantHidden?: boolean;
  initialHistoryHidden?: boolean;
  userId?: string;
}

export default function UserPlantDetailClient({
  initialPlant = null,
  initialHistory = [],
  initialProfile = null,
  initialPlantHidden = false,
  initialHistoryHidden = false,
  userId: propsUserId,
}: UserPlantDetailClientProps) {
  const t = useTranslations('UserPlantDetailPage');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const userId = (params.id as string) || propsUserId;
  const plantId = params.plantId as string;

  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || locale;

  const [plant, setPlant] = useState<Plant | null>(initialPlant);
  const [history, setHistory] = useState<PlantHistory[]>(initialHistory);
  const [profile, setProfile] = useState(initialProfile);
  const [plantHidden, setPlantHidden] = useState(initialPlantHidden);
  const [historyHidden, setHistoryHidden] = useState(initialHistoryHidden);
  const [isLoading, setIsLoading] = useState(!initialPlant && !initialPlantHidden);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [selectedHistoryPhotos, setSelectedHistoryPhotos] = useState<{ photos: string[]; index: number } | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isOwnPlant = user && plant && user.id === plant.userId;

  useEffect(() => {
    if (!user || !plantId || isOwnPlant) return;
    bookmarksApi.getStatus('plant', plantId)
      .then((res) => setIsBookmarked(res.isBookmarked))
      .catch(() => {});
  }, [user, plantId, isOwnPlant]);

  const handleBookmarkToggle = async () => {
    if (!user || !plantId || isBookmarkLoading) return;
    setIsBookmarkLoading(true);
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      const res = await bookmarksApi.toggle('plant', plantId);
      setIsBookmarked(res.bookmarked);
      toast.success(res.bookmarked ? t('bookmark.saved') : t('bookmark.removed'));
    } catch {
      setIsBookmarked(prev);
      toast.error(t('bookmark.error'));
    } finally {
      setIsBookmarkLoading(false);
    }
  };


  useEffect(() => {
    if (!userId || !plantId) return;
    if (initialPlant || initialPlantHidden) return;

    setIsLoading(true);
    Promise.all([
      usersApi.getUserPlant(userId, plantId).catch((err) => {
        if (err?.response?.status === 403) {
          setPlantHidden(true);
          return null;
        }
        throw err;
      }),
      usersApi.getUserPlantHistory(userId, plantId).catch((err) => {
        if (err?.response?.status === 403) setHistoryHidden(true);
        return [];
      }),
    ])
      .then(([plantData, historyData]) => {
        setPlant(plantData);
        setHistory(historyData as PlantHistory[]);
      })
      .catch(() => {
        toast.error(t('errors.loadError'));
        router.back();
      })
      .finally(() => setIsLoading(false));
  }, [initialPlant, initialPlantHidden, plantId, router, userId]);

  const handleCopyPlantLink = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const plantUrl = `${baseUrl}/profile/${userId}/plants/${plantId}`;

    try {
      await navigator.clipboard.writeText(plantUrl);
      setIsLinkCopied(true);
      toast.success(t('errors.copyLinkSuccess'));

      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (error) {
      toast.error(t('errors.copyLinkError'));
      console.error('Failed to copy link:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 fade-in duration-300">
        <div className="text-center space-y-2">
          <Leaf className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (plantHidden) {
    return (
      <div className="space-y-6 fade-in slide-in-from-bottom-2 duration-700">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </Button>

        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <EyeOff className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h1 className="text-xl font-semibold mb-2">{t('plantHidden.title')}</h1>
              <p className="text-muted-foreground">{t('plantHidden.description')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plant) return null;

  const genus = typeof plant.genusId === 'object' ? plant.genusId as Genus : null;
  const variety = typeof plant.varietyId === 'object' ? plant.varietyId as Variety : null;

  const plantName = [getDisplayName(genus, language), getDisplayName(variety, language)]
    .filter(Boolean).join(' - ');
  const photoUrl = getPlantPhotoUrl(plant.photo);

  return (
    <div className="space-y-6 fade-in slide-in-from-bottom-2 duration-700">
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

      {/* Plant Info */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex-shrink-0 w-full sm:w-48 md:w-56">
              <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden rounded-lg group">
                {photoUrl ? (
                  <button onClick={() => setIsPhotoGalleryOpen(true)} className="w-full h-full">
                    <img
                      src={photoUrl}
                      alt={plantName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    />
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Leaf className="w-20 h-20 sm:w-24 sm:h-24 text-primary/30" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-semibold">
                    {plantName || 'Noname'}
                  </h1>

                  {user && !isOwnPlant && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBookmarkToggle}
                      disabled={isBookmarkLoading}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-all active:scale-95 shrink-0"
                      title={isBookmarked ? t('bookmark.remove') : t('bookmark.save')}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-primary' : ''}`} />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPlantLink}
                    className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground transition-all active:scale-95"
                    title={t('plantInfo.copyLinkTooltip')}
                  >
                    {isLinkCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span className="text-xs">{t('plantInfo.copiedButton')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-xs">{t('plantInfo.copyButton')}</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{t('plantInfo.title')}</p>
              </div>

              <div className="grid gap-6">
                {/* Two column layout for genus, variety, owner, and purchase date */}
                <div className="flex items-center flex-wrap gap-4">
                  <div className="space-y-4 mr-10">
                    {profile && (
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t('plantInfo.owner')}</p>
                          <button
                            onClick={() => router.push(`/profile/${userId}`)}
                            className="text-sm font-medium text-primary hover:underline transition-all active:scale-95"
                          >
                            {profile.name}
                          </button>
                        </div>
                      </div>
                    )}

                    {plant.purchaseDate && (
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t('plantInfo.purchaseDate')}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(plant.purchaseDate).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mr-10 flex flex-col h-full">
                    <div className="flex items-start gap-3">
                      <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('plantInfo.genus')}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {getDisplayName(genus, language) || t('plantInfo.genusEmpty')}
                        </p>
                      </div>
                    </div>

                    {variety && (
                      <div className="flex items-start gap-3">
                        <Leaf className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t('plantInfo.variety')}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {getDisplayName(variety, language)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description spans full width */}
                {plant.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium mb-1">{t('plantInfo.description')}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {plant.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discover Banner for unregistered users */}
      {isMounted && !user && <DiscoverBanner />}

      {/* History (read-only) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('history.title')}</CardTitle>
          <CardDescription>
            {historyHidden ? t('history.hiddenByUser') : history.length > 0 ? t('history.total', { count: history.length }) : t('history.empty')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {historyHidden ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <EyeOff className="w-5 h-5" />
              <span>{t('history.hiddenMessage')}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <MessageSquare className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm">{t('history.emptyState')}</p>
            </div>
          ) : (
            <div className="relative">
              {history.map((item, index) => {
                const isLast = index === history.length - 1;
                const photoUrls = item.photos.map(p => getPlantHistoryPhotoUrl(p)!);
                const date = new Date(item.date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const formattedDate = `${day}.${month}.${year}`;
                return (
                  <div key={item._id} className="relative flex gap-3">
                    <div className="relative flex flex-col items-center pt-1">
                      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center z-10 flex-shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {!isLast && (
                        <div className="absolute top-11 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-border" />
                      )}
                    </div>

                    <div className="flex-1 pb-8 pt-2">
                      <span className="text-xs text-muted-foreground">{formattedDate}</span>
                      {item.comment && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mt-2 mb-3">
                          {item.comment}
                        </p>
                      )}
                      {item.photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                          {item.photos.map((photo, photoIdx) => (
                            <button
                              key={photo}
                              onClick={() => setSelectedHistoryPhotos({ photos: photoUrls, index: photoIdx })}
                              className="aspect-square rounded-lg overflow-hidden bg-muted transition-all hover:scale-105 hover:shadow-md active:scale-95"
                            >
                              <img
                                src={getPlantHistoryPhotoUrl(photo)}
                                alt={`PlantPhoto ${photoIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {isPhotoGalleryOpen && photoUrl && (
        <PhotoGallery
          photos={[photoUrl]}
          initialIndex={0}
          onClose={() => setIsPhotoGalleryOpen(false)}
        />
      )}

      {selectedHistoryPhotos && (
        <PhotoGallery
          photos={selectedHistoryPhotos.photos}
          initialIndex={selectedHistoryPhotos.index}
          onClose={() => setSelectedHistoryPhotos(null)}
        />
      )}
    </div>
  );
}
