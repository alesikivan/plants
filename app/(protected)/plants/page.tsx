'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ComboBox } from '@/components/ui/combobox';
import { Plus, Leaf, Search, X, SlidersHorizontal, Archive } from 'lucide-react';
import { plantsApi, Plant, shelvesApi, Shelf, Genus, Variety } from '@/lib/api';
import { AddPlantModal } from '@/components/plants/AddPlantModal';
import { PlantCard } from '@/components/plants/PlantCard';
import { toast } from 'sonner';

const COMBOBOX_CLASS = 'h-11 rounded-xl border-2 text-base font-normal';

export default function MyPlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [allVarieties, setAllVarieties] = useState<Variety[]>([]);
  const [genera, setGenera] = useState<Genus[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genusFilter, setGenusFilter] = useState('');
  const [genusSearch, setGenusSearch] = useState('');
  const [varietyFilter, setVarietyFilter] = useState('');
  const [varietySearch, setVarietySearch] = useState('');
  const [shelfFilter, setShelfFilter] = useState('');
  const [shelfSearch, setShelfSearch] = useState('');

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const filtersRef = useRef({ search: '', genusId: '', varietyId: '', shelfId: '' });

  useEffect(() => {
    initialLoad();
  }, []);

  const initialLoad = async () => {
    setIsLoading(true);
    try {
      const [plantsData, shelvesData] = await Promise.all([
        plantsApi.getAll(),
        shelvesApi.getAll(),
      ]);
      setPlants(plantsData);
      setShelves(shelvesData);

      const genusMap = new Map<string, Genus>();
      const varietyMap = new Map<string, Variety>();
      plantsData.forEach((p) => {
        if (typeof p.genusId === 'object' && p.genusId) {
          genusMap.set(p.genusId._id, p.genusId as Genus);
        }
        if (typeof p.varietyId === 'object' && p.varietyId) {
          varietyMap.set(p.varietyId._id, p.varietyId as Variety);
        }
      });
      setGenera(
        Array.from(genusMap.values()).sort((a, b) => a.nameRu.localeCompare(b.nameRu))
      );
      setAllVarieties(
        Array.from(varietyMap.values()).sort((a, b) => a.nameRu.localeCompare(b.nameRu))
      );
    } catch (error) {
      toast.error('Ошибка загрузки растений');
      console.error('Failed to load plants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Varieties for the dropdown: filtered by selected genus
  const visibleVarieties = useMemo(() => {
    if (!genusFilter) return allVarieties;
    return allVarieties.filter((v) => {
      const gId = typeof v.genusId === 'object' ? v.genusId._id : v.genusId;
      return gId === genusFilter;
    });
  }, [allVarieties, genusFilter]);

  // Client-side filtering of dropdown options by search text
  const genusOptions = useMemo(() => {
    const q = genusSearch.toLowerCase();
    return genera
      .filter(
        (g) =>
          !q ||
          g.nameRu.toLowerCase().includes(q) ||
          g.nameEn.toLowerCase().includes(q)
      )
      .map((g) => ({ value: g._id, label: `${g.nameRu} / ${g.nameEn}` }));
  }, [genera, genusSearch]);

  const varietyOptions = useMemo(() => {
    const q = varietySearch.toLowerCase();
    return visibleVarieties
      .filter(
        (v) =>
          !q ||
          v.nameRu.toLowerCase().includes(q) ||
          v.nameEn.toLowerCase().includes(q)
      )
      .map((v) => ({ value: v._id, label: `${v.nameRu} / ${v.nameEn}` }));
  }, [visibleVarieties, varietySearch]);

  const shelfOptions = useMemo(() => {
    const q = shelfSearch.toLowerCase();
    return shelves
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((s) => ({ value: s._id, label: s.name }));
  }, [shelves, shelfSearch]);

  const applyFilters = async (
    search: string,
    genusId: string,
    varietyId: string,
    shelfId: string,
    archived = showArchived,
  ) => {
    setIsFiltering(true);
    try {
      const data = await plantsApi.getAll({
        search: search || undefined,
        genusId: genusId || undefined,
        varietyId: varietyId || undefined,
        shelfId: shelfId || undefined,
        showArchived: archived,
      });
      setPlants(data);
    } catch (error) {
      toast.error('Ошибка загрузки растений');
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
      const { search, genusId, varietyId, shelfId } = filtersRef.current;
      applyFilters(search, genusId, varietyId, shelfId);
    }, 400);
  };

  const handleGenusChange = (value: string) => {
    setGenusFilter(value);
    setGenusSearch('');
    // Reset variety when genus changes
    setVarietyFilter('');
    setVarietySearch('');
    filtersRef.current.genusId = value;
    filtersRef.current.varietyId = '';
    applyFilters(filtersRef.current.search, value, '', filtersRef.current.shelfId);
  };

  const handleVarietyChange = (value: string) => {
    setVarietyFilter(value);
    setVarietySearch('');
    filtersRef.current.varietyId = value;
    applyFilters(
      filtersRef.current.search,
      filtersRef.current.genusId,
      value,
      filtersRef.current.shelfId,
    );
  };

  const handleShelfChange = (value: string) => {
    setShelfFilter(value);
    setShelfSearch('');
    filtersRef.current.shelfId = value;
    applyFilters(
      filtersRef.current.search,
      filtersRef.current.genusId,
      filtersRef.current.varietyId,
      value,
    );
  };

  const handleTabChange = (archived: boolean) => {
    setShowArchived(archived);
    setSearchQuery('');
    setGenusFilter('');
    setGenusSearch('');
    setVarietyFilter('');
    setVarietySearch('');
    setShelfFilter('');
    setShelfSearch('');
    filtersRef.current = { search: '', genusId: '', varietyId: '', shelfId: '' };
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applyFilters('', '', '', '', archived);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setGenusFilter('');
    setGenusSearch('');
    setVarietyFilter('');
    setVarietySearch('');
    setShelfFilter('');
    setShelfSearch('');
    filtersRef.current = { search: '', genusId: '', varietyId: '', shelfId: '' };
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applyFilters('', '', '', '');
  };

  const handleSuccess = () => {
    clearFilters();
    initialLoad();
  };

  const [showFilters, setShowFilters] = useState(false);

  const hasFilters =
    searchQuery !== '' || genusFilter !== '' || varietyFilter !== '' || shelfFilter !== '';
  const isBusy = isLoading || isFiltering;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Мои растения</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Управляйте своей<br className="sm:hidden" /> коллекцией растений
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 transition-all active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Добавить растение
        </Button>
      </div>

      {/* Tabs: active / archived */}
      {!isLoading && (
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit animate-in fade-in duration-300">
          <button
            onClick={() => !showArchived || handleTabChange(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!showArchived ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Leaf className="w-4 h-4" />
            Активные
          </button>
          <button
            onClick={() => showArchived || handleTabChange(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showArchived ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Archive className="w-4 h-4" />
            Архив
          </button>
        </div>
      )}

      {/* Filters */}
      {!isLoading && !showArchived && (genera.length > 0 || shelves.length > 0) && (
        <div className="flex flex-col gap-2 animate-in fade-in duration-500">
          {/* Row 1: search + filter toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <Button
              variant={hasFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters((v) => !v)}
              className="relative shrink-0 h-11 w-11 p-0 rounded-xl"
              title="Фильтры"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
              )}
            </Button>
          </div>

          {/* Row 2: filter comboboxes (collapsible) */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {genera.length > 1 && (
                <div className="w-full sm:flex-1">
                  <ComboBox
                    options={genusOptions}
                    value={genusFilter}
                    onValueChange={handleGenusChange}
                    placeholder="Все роды"
                    searchPlaceholder="Поиск рода..."
                    emptyText="Ничего не найдено"
                    onSearchChange={setGenusSearch}
                    className={COMBOBOX_CLASS}
                  />
                </div>
              )}

              {visibleVarieties.length > 0 && (
                <div className="w-full sm:flex-1">
                  <ComboBox
                    options={varietyOptions}
                    value={varietyFilter}
                    onValueChange={handleVarietyChange}
                    placeholder="Все сорта"
                    searchPlaceholder="Поиск сорта..."
                    emptyText="Ничего не найдено"
                    onSearchChange={setVarietySearch}
                    className={COMBOBOX_CLASS}
                  />
                </div>
              )}

              {shelves.length > 0 && (
                <div className="w-full sm:flex-1">
                  <ComboBox
                    options={shelfOptions}
                    value={shelfFilter}
                    onValueChange={handleShelfChange}
                    placeholder="Все полки"
                    searchPlaceholder="Поиск полки..."
                    emptyText="Ничего не найдено"
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
                    title="Сбросить фильтры"
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
                    Очистить фильтры
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
            <p className="text-muted-foreground">Загрузка растений...</p>
          </div>
        </div>
      ) : plants.length === 0 && !hasFilters ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          {showArchived ? (
            <>
              <Archive className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Архив пуст</h3>
              <p className="text-muted-foreground">Здесь будут архивированные растения</p>
            </>
          ) : (
            <>
              <Leaf className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">У вас пока нет растений</h3>
              <p className="text-muted-foreground mb-6">
                Начните отслеживать свою коллекцию, добавив первое растение
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Добавить первое растение
              </Button>
            </>
          )}
        </div>
      ) : plants.length === 0 && hasFilters ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <Search className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ничего не найдено</h3>
          <p className="text-muted-foreground mb-4">
            Попробуйте изменить фильтры или поисковый запрос
          </p>
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {hasFilters && !isBusy && (
            <p className="text-sm text-muted-foreground">Найдено: {plants.length}</p>
          )}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 transition-opacity duration-200 ${isBusy ? 'opacity-50' : 'opacity-100'}`}
          >
            {plants.map((plant, index) => (
              <PlantCard key={plant._id} plant={plant} index={index} />
            ))}
          </div>
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
