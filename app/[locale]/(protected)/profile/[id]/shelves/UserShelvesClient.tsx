'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, EyeOff, Layers } from 'lucide-react';
import { usersApi, Shelf } from '@/lib/api';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import { toast } from 'sonner';

interface UserShelvesClientProps {
  initialShelves?: Shelf[];
  initialHidden?: boolean;
}

export default function UserShelvesClient({
  initialShelves = [],
  initialHidden = false,
}: UserShelvesClientProps) {
  const t = useTranslations('UserShelvesPage');
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [shelves, setShelves] = useState<Shelf[]>(initialShelves);
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(initialHidden);

  useEffect(() => {
    if (!userId) return;
    if (initialShelves.length > 0 || initialHidden) return;

    setIsLoading(true);
    usersApi.getUserShelves(userId)
      .then(setShelves)
      .catch((error) => {
        if (error?.response?.status === 403) {
          setIsHidden(true);
          return;
        }
        toast.error(t('errors.loadError'));
      })
      .finally(() => setIsLoading(false));
  }, [initialHidden, initialShelves.length, userId, t]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('header.backButton')}
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('header.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('header.description')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <Layers className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        </div>
      ) : isHidden ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <EyeOff className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('hidden.title')}</h3>
          <p className="text-muted-foreground">{t('hidden.description')}</p>
        </div>
      ) : shelves.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <Layers className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('empty.title')}</h3>
          <p className="text-muted-foreground">{t('empty.description')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {shelves.map((shelf, index) => (
            <ShelfCard
              key={shelf._id}
              shelf={shelf}
              index={index}
              href={`/profile/${userId}/shelves/${shelf._id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
