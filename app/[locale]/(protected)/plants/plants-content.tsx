'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ComboBox } from '@/components/ui/combobox';
import { Plus, Leaf, Search, X, SlidersHorizontal, Archive, GripVertical, Check } from 'lucide-react';
import { plantsApi, Plant, shelvesApi, Shelf, Genus } from '@/lib/api';
import { AddPlantModal } from '@/components/plants/AddPlantModal';
import { trackEvent } from '@/lib/analytics';
import { PlantCard } from '@/components/plants/PlantCard';
import { SortablePlantCard } from '@/components/plants/SortablePlantCard';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';

const COMBOBOX_CLASS = 'h-11 rounded-xl border-2 text-base font-normal';

export function PlantsPageContent() {
  const t = useTranslations('PlantsPage');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [genera, setGenera] = useState<Genus[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showArchived, setShowArchived] = useState(searchParams.get('tab') === 'archive');
  const [searchQuery, setSearchQuery] = useState('');
  const [genusFilter, setGenusFilter] = useState('');
  const [genusSearch, setGenusSearch] = useState('');
  const [shelfFilter, setShelfFilter] = useState('');
  const [shelfSearch, setShelfSearch] = useState('');

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isReorderSaving, setIsReorderSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const filtersRef = useRef({ search: '', genusId: '', shelfId: '' });

  useEffect(() => {
    initialLoad(showArchived);
  }, []);

  const initialLoad = async (archived = false) => {
    setIsLoading(true);
    try {
      const [plantsData, shelvesData] = await Promise.all([
        plantsApi.getAll({ showArchived: archived }),
        shelvesApi.getAll(),
      ]);
      setPlants(plantsData);
      setShelves(shelvesData);

      const genusMap = new Map<string, Genus>();
      plantsData.forEach((p) => {
        if (typeof p.genusId === 'object' && p.genusId) {
          genusMap.set(p.genusId._id, p.genusId as Genus);
        }
      });
      setGenera(
        Array.from(genusMap.values()).sort((a, b) => a.nameRu.localeCompare(b.nameRu))
      );
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error('Failed to load plants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering of dropdown options by search text
  const genusOptions = useMemo(() => {
    const q = genusSearch.toLowerCase();
    const getDisplayName = (nameRu: string, nameEn: string) => {
      return locale === 'ru' ? `${nameRu} / ${nameEn}` : nameEn;
    };
    return genera
      .filter(
        (g) =>
          !q ||
          g.nameRu.toLowerCase().includes(q) ||
          g.nameEn.toLowerCase().includes(q)
      )
      .map((g) => ({ value: g._id, label: getDisplayName(g.nameRu, g.nameEn) }));
  }, [genera, genusSearch, locale]);

  const shelfOptions = useMemo(() => {
    const q = shelfSearch.toLowerCase();
    return shelves
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((s) => ({ value: s._id, label: s.name }));
  }, [shelves, shelfSearch]);

  const applyFilters = async (
    search: string,
    genusId: string,
    shelfId: string,
    archived = showArchived,
  ) => {
    setIsFiltering(true);
    try {
      const data = await plantsApi.getAll({
        search: search || undefined,
        genusId: genusId || undefined,
        shelfId: shelfId || undefined,
        showArchived: archived,
      });
      setPlants(data);
    } catch (error) {
      toast.error(t('toasts.loadError'));
      console.error('Failed to filter plants:', error);
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
      const { search, genusId, shelfId } = filtersRef.current;
      if (search) trackEvent('plants_searched', { query_length: search.length });
      applyFilters(search, genusId, shelfId);
    }, 400);
  };

  const handleGenusChange = (value: string) => {
    setGenusFilter(value);
    setGenusSearch('');
    filtersRef.current.genusId = value;
    if (value) trackEvent('plants_filtered_genus');
    applyFilters(filtersRef.current.search, value, filtersRef.current.shelfId);
  };

  const handleShelfChange = (value: string) => {
    setShelfFilter(value);
    setShelfSearch('');
    filtersRef.current.shelfId = value;
    if (value) trackEvent('plants_filtered_shelf');
    applyFilters(
      filtersRef.current.search,
      filtersRef.current.genusId,
      value,
    );
  };

  const handleTabChange = (archived: boolean) => {
    trackEvent('plants_tab_switched', { tab: archived ? 'archive' : 'active' });
    setShowArchived(archived);
    setSearchQuery('');
    setGenusFilter('');
    setGenusSearch('');
    setShelfFilter('');
    setShelfSearch('');
    filtersRef.current = { search: '', genusId: '', shelfId: '' };
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applyFilters('', '', '', archived);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setGenusFilter('');
    setGenusSearch('');
    setShelfFilter('');
    setShelfSearch('');
    filtersRef.current = { search: '', genusId: '', shelfId: '' };
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applyFilters('', '', '');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = plants.findIndex((p) => p._id === active.id);
    const newIndex = plants.findIndex((p) => p._id === over.id);
    setPlants(arrayMove(plants, oldIndex, newIndex));
  };

  const handleSaveOrder = async () => {
    setIsReorderSaving(true);
    try {
      await plantsApi.reorder(plants.map((p) => p._id));
      setIsReorderMode(false);
      trackEvent('plants_reorder_saved', { count: plants.length });
      toast.success(t('toasts.orderSaved'));
    } catch {
      toast.error(t('toasts.saveError'));
    } finally {
      setIsReorderSaving(false);
    }
  };

  const handleCancelReorder = () => {
    setIsReorderMode(false);
    applyFilters(
      filtersRef.current.search,
      filtersRef.current.genusId,
      filtersRef.current.shelfId,
    );
  };

  const handleSuccess = () => {
    clearFilters();
    initialLoad();
  };

  const [showFilters, setShowFilters] = useState(false);

  const hasFilters =
    searchQuery !== '' || genusFilter !== '' || shelfFilter !== '';
  const isBusy = isLoading || isFiltering;
  const canShowAdvancedFilters = !showArchived && (genera.length > 1 || shelves.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('header.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {t('header.description')}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {isReorderMode ? (
            <>
              <Button
                onClick={handleCancelReorder}
                variant="outline"
                className="flex-1 sm:flex-none gap-2 transition-all active:scale-95"
                disabled={isReorderSaving}
              >
                <X className="w-4 h-4" />
                {t('buttons.cancel')}
              </Button>
              <Button
                onClick={handleSaveOrder}
                className="flex-1 sm:flex-none gap-2 transition-all active:scale-95"
                disabled={isReorderSaving}
              >
                <Check className="w-4 h-4" />
                {isReorderSaving ? t('buttons.saving') : t('buttons.save')}
              </Button>
            </>
          ) : (
            <>
              {!showArchived && !hasFilters && plants.length > 1 && (
                <Button
                  variant="outline"
                  onClick={() => { setIsReorderMode(true); trackEvent('plants_reorder_started'); }}
                  className="transition-all active:scale-95 shrink-0 h-11 w-11 p-0 sm:w-auto sm:px-4 sm:gap-2 rounded-xl"
                  title={t('buttons.reorder')}
                >
                  <GripVertical className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('buttons.reorder')}</span>
                </Button>
              )}
              <Button
                onClick={() => { setIsModalOpen(true); trackEvent('plant_add_modal_opened', { source: 'list' }); }}
                className="gap-2 transition-all active:scale-95 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" />
                {t('buttons.addPlant')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs: active / archived */}
      {!isLoading && (
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit animate-in fade-in duration-300 !mt-2">
          <button
            onClick={() => !showArchived || handleTabChange(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!showArchived ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Leaf className="w-4 h-4" />
            {t('tabs.active')}
          </button>
          <button
            onClick={() => showArchived || handleTabChange(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showArchived ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Archive className="w-4 h-4" />
            {t('tabs.archive')}
          </button>
        </div>
      )}

      {/* Filters */}
      {!isLoading && (
        <div className="flex flex-col gap-2 animate-in fade-in duration-500 !mt-2">
          {/* Row 1: search + filter toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            {canShowAdvancedFilters ? (
              <Button
                variant={hasFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters((v) => !v)}
                className="relative shrink-0 h-11 w-11 p-0 rounded-xl"
                title={t('filters.title')}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {hasFilters && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                )}
              </Button>
            ) : (
              searchQuery && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="shrink-0 h-11 w-11 p-0 rounded-xl"
                  title={t('buttons.clearSearchMobile')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )
            )}
          </div>

          {/* Row 2: filter comboboxes (collapsible) */}
          {showFilters && canShowAdvancedFilters && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {genera.length > 1 && (
                <div className="w-full sm:flex-1">
                  <ComboBox
                    options={genusOptions}
                    value={genusFilter}
                    onValueChange={handleGenusChange}
                    placeholder={t('search.allGenus')}
                    searchPlaceholder={t('search.genusPlaceholder')}
                    emptyText={t('search.emptyText')}
                    onSearchChange={setGenusSearch}
                    className={COMBOBOX_CLASS}
                  />
                </div>
              )}

              {!showArchived && shelves.length > 0 && (
                <div className="w-full sm:flex-1">
                  <ComboBox
                    options={shelfOptions}
                    value={shelfFilter}
                    onValueChange={handleShelfChange}
                    placeholder={t('search.allShelves')}
                    searchPlaceholder={t('search.shelfPlaceholder')}
                    emptyText={t('search.emptyText')}
                    onSearchChange={setShelfSearch}
                    className={COMBOBOX_CLASS}
                  />
                </div>
              )}

              {hasFilters && (
                <>
                  {/* Desktop: icon only */}
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="shrink-0 h-11 w-11 p-0 rounded-xl hidden sm:flex items-center justify-center"
                    title={t('buttons.clearFilters')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {/* Mobile: full width with text */}
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full h-11 gap-2 rounded-xl sm:hidden"
                  >
                    <X className="w-4 h-4" />
                    {t('buttons.clearSearch')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <Leaf className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
            <p className="text-muted-foreground">{t('messages.loading')}</p>
          </div>
        </div>
      ) : plants.length === 0 && !hasFilters ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          {showArchived ? (
            <>
              <Archive className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('empty.emptyArchive.title')}</h3>
              <p className="text-muted-foreground">{t('empty.emptyArchive.description')}</p>
            </>
          ) : (
            <>
              <Leaf className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('empty.noPlants.title')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('empty.noPlants.description')}
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {t('empty.noPlants.button')}
              </Button>
            </>
          )}
        </div>
      ) : plants.length === 0 && hasFilters ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <Search className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('empty.noResults.title')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('empty.noResults.description')}
          </p>
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            {t('empty.noResults.button')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {hasFilters && !isBusy && (
            <p className="text-sm text-muted-foreground">{t('messages.found', { count: plants.length })}</p>
          )}
          {isReorderMode && (
            <p className="text-sm text-muted-foreground animate-in fade-in duration-200">
              {t('messages.dragging')}
            </p>
          )}
          {isReorderMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={plants.map((p) => p._id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {plants.map((plant) => (
                    <SortablePlantCard key={plant._id} plant={plant} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeDragId ? (
                  <div className="opacity-90 scale-105 shadow-xl rounded-lg">
                    <PlantCard plant={plants.find((p) => p._id === activeDragId)!} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 transition-opacity duration-200 ${isBusy ? 'opacity-50' : 'opacity-100'}`}
            >
              {plants.map((plant, index) => (
                <PlantCard
                  key={plant._id}
                  plant={plant}
                  index={index}
                  href={showArchived ? `/plants/${plant._id}?from=archive` : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AddPlantModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
