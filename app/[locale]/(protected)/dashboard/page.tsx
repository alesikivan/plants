'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ComboBox } from '@/components/ui/combobox';
import { Leaf, Heart, Plus, Search, X, SlidersHorizontal } from 'lucide-react';
import { wishlistApi, Wishlist, Genus } from '@/lib/api';
import { WishlistCard, AddWishlistModal } from '@/components/wishlist';
import { getDisplayName } from '@/lib/utils/language';
import { toast } from 'sonner';

const COMBOBOX_CLASS = 'h-10 rounded-xl border-2 text-sm font-normal';

export default function DashboardPage() {
  const t = useTranslations('DashboardPage');
  const locale = useLocale();
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';
  const router = useRouter();

  const [wishlist, setWishlist] = useState<Wishlist[]>([]);
  const [genera, setGenera] = useState<Genus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [genusFilter, setGenusFilter] = useState('');
  const [genusSearch, setGenusSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const filtersRef = useRef({ search: '', genusId: '' });

  useEffect(() => {
    initialLoad();
  }, []);

  const initialLoad = async () => {
    setIsLoading(true);
    try {
      const data = await wishlistApi.getAll();
      setWishlist(data);

      const genusMap = new Map<string, Genus>();
      data.forEach((item) => {
        if (typeof item.genusId === 'object' && item.genusId) {
          genusMap.set((item.genusId as Genus)._id, item.genusId as Genus);
        }
      });
      setGenera(
        Array.from(genusMap.values()).sort((a, b) =>
          getDisplayName(a, language).localeCompare(getDisplayName(b, language))
        )
      );
    } catch (error) {
      toast.error(t('wishlistLoadError'));
      console.error('Failed to load wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const genusOptions = useMemo(() => {
    const q = genusSearch.toLowerCase();
    return genera
      .filter((g) => !q || getDisplayName(g, language).toLowerCase().includes(q))
      .map((g) => ({ value: g._id, label: locale === 'ru' ? `${g.nameRu} / ${g.nameEn}` : g.nameEn }));
  }, [genera, genusSearch, language, locale]);

  const applyFilters = async (search: string, genusId: string) => {
    setIsFiltering(true);
    try {
      const data = await wishlistApi.getAll({
        search: search || undefined,
        genusId: genusId || undefined,
      });
      setWishlist(data);
    } catch (error) {
      toast.error(t('wishlistLoadError'));
      console.error('Failed to filter wishlist:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    filtersRef.current.search = value;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const { search, genusId } = filtersRef.current;
      applyFilters(search, genusId);
    }, 400);
  };

  const handleGenusChange = (value: string) => {
    setGenusFilter(value);
    setGenusSearch('');
    filtersRef.current.genusId = value;
    applyFilters(filtersRef.current.search, value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setGenusFilter('');
    setGenusSearch('');
    filtersRef.current = { search: '', genusId: '' };
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applyFilters('', '');
  };

  const handleSuccess = () => {
    clearFilters();
    initialLoad();
  };

  const hasFilters = searchQuery !== '' || genusFilter !== '';
  const isBusy = isLoading || isFiltering;

  return (
    <div className="space-y-8 mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Quick Actions */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <h2 className="text-2xl font-bold mb-4">{t('quickActions')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => router.push('/plants')}
            className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left group active:scale-95"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">{t('addPlant')}</h3>
              <p className="text-sm text-muted-foreground">{t('startTracking')}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Wishlist Section */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">{t('wishlist')}</h2>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm">
            <Plus className="w-4 h-4" />
            <span className='hidden sm:block'>{t('addWishlist')}</span>
          </Button>
        </div>

        {/* Filters */}
        {!isLoading && (genera.length > 0 || wishlist.length > 0 || hasFilters) && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-9 h-10"
                />
              </div>
              {genera.length > 0 && (
                <Button
                  variant={hasFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters((v) => !v)}
                  className="relative shrink-0 h-10 w-10 p-0 rounded-xl"
                  title={t('filters')}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {hasFilters && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                  )}
                </Button>
              )}
            </div>

            {showFilters && genera.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {genera.length > 0 && (
                  <div className="w-full sm:flex-1">
                    <ComboBox
                      options={genusOptions}
                      value={genusFilter}
                      onValueChange={handleGenusChange}
                      placeholder={t('allGenus')}
                      searchPlaceholder={t('genusSearchPlaceholder')}
                      emptyText={t('emptyText')}
                      onSearchChange={setGenusSearch}
                      className={COMBOBOX_CLASS}
                    />
                  </div>
                )}
                {hasFilters && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="shrink-0 h-10 w-10 p-0 rounded-xl hidden sm:flex items-center justify-center"
                      title={t('clearFilters')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full h-10 gap-2 rounded-xl sm:hidden"
                    >
                      <X className="w-4 h-4" />
                      {t('clearFiltersButton')}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        ) : wishlist.length === 0 && !hasFilters ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('emptyWishlist')}</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                {t('emptyWishlistDescription')}
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('addPlantButton')}
              </Button>
            </CardContent>
          </Card>
        ) : wishlist.length === 0 && hasFilters ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="font-medium mb-1">{t('nothingFound')}</p>
            <p className="text-sm text-muted-foreground mb-4">{t('tryChangingQuery')}</p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
              <X className="w-4 h-4" />
              {t('clearFilters')}
            </Button>
          </div>
        ) : (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 transition-opacity duration-200 ${isBusy ? 'opacity-50' : 'opacity-100'}`}>
            {wishlist.map((item) => (
              <WishlistCard
                key={item._id}
                wishlistItem={item}
                onUpdate={handleSuccess}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Wishlist Modal */}
      <AddWishlistModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
