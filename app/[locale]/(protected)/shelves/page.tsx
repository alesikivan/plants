'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Layers, Search, X, GripVertical, Check } from 'lucide-react';
import { shelvesApi, Shelf } from '@/lib/api';
import { AddShelfModal } from '@/components/shelves/AddShelfModal';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import { SortableShelfCard } from '@/components/shelves/SortableShelfCard';
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

export default function ShelvesPage() {
  const t = useTranslations('ShelvesPage');
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef('');

  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isReorderSaving, setIsReorderSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  useEffect(() => {
    loadShelves();
  }, []);

  const loadShelves = async () => {
    setIsLoading(true);
    try {
      const data = await shelvesApi.getAll();
      setShelves(data);
    } catch (error) {
      toast.error(t('messages.loadError'));
      console.error('Failed to load shelves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applySearch = async (search: string) => {
    setIsFiltering(true);
    try {
      const data = await shelvesApi.getAll({ search: search || undefined });
      setShelves(data);
    } catch (error) {
      toast.error(t('messages.loadError'));
      console.error('Failed to search shelves:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchRef.current = value;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      applySearch(searchRef.current);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchRef.current = '';
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applySearch('');
  };

  const handleSuccess = () => {
    handleClearSearch();
    loadShelves();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = shelves.findIndex((s) => s._id === active.id);
    const newIndex = shelves.findIndex((s) => s._id === over.id);
    setShelves(arrayMove(shelves, oldIndex, newIndex));
  };

  const handleSaveOrder = async () => {
    setIsReorderSaving(true);
    try {
      await shelvesApi.reorder(shelves.map((s) => s._id));
      setIsReorderMode(false);
      toast.success(t('messages.orderSaved'));
    } catch {
      toast.error(t('messages.saveOrderError'));
    } finally {
      setIsReorderSaving(false);
    }
  };

  const handleCancelReorder = () => {
    setIsReorderMode(false);
    loadShelves();
  };

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
        {isReorderMode ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleCancelReorder}
              disabled={isReorderSaving}
              className="flex-1 sm:flex-none gap-2"
            >
              <X className="w-4 h-4" />
              {t('buttons.cancelReorder')}
            </Button>
            <Button
              onClick={handleSaveOrder}
              disabled={isReorderSaving}
              className="flex-1 sm:flex-none gap-2"
            >
              <Check className="w-4 h-4" />
              {t('buttons.saveOrder')}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {shelves.length > 1 && !searchQuery && (
              <Button
                variant="outline"
                onClick={() => setIsReorderMode(true)}
                className="h-11 w-11 px-0 sm:w-auto sm:px-6 sm:flex-none gap-2"
                title={t('buttons.reorder')}
              >
                <GripVertical className="w-4 h-4" />
                <span className="hidden sm:inline">{t('buttons.reorder')}</span>
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none gap-2 transition-all active:scale-95">
              <Plus className="w-4 h-4" />
              {t('buttons.createShelf')}
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      {!isReorderMode && !isLoading && shelves.length > 0 && (
        <div className="relative animate-in fade-in duration-500">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Shelves Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <Layers className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
            <p className="text-muted-foreground">{t('messages.loading')}</p>
          </div>
        </div>
      ) : shelves.length === 0 && !searchQuery ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <Layers className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('empty.noShelves.title')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('empty.noShelves.description')}
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            {t('empty.noShelves.button')}
          </Button>
        </div>
      ) : shelves.length === 0 && searchQuery ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <Search className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('empty.noResults.title')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('empty.noResults.description')}
          </p>
          <Button variant="outline" onClick={handleClearSearch} className="gap-2">
            <X className="w-4 h-4" />
            {t('empty.noResults.button')}
          </Button>
        </div>
      ) : isReorderMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={shelves.map((s) => s._id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {shelves.map((shelf, index) => (
                <SortableShelfCard key={shelf._id} shelf={shelf} index={index} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDragId ? (
              <div className="opacity-90 rotate-2 scale-105 shadow-2xl">
                <ShelfCard
                  shelf={shelves.find((s) => s._id === activeDragId)!}
                  index={shelves.findIndex((s) => s._id === activeDragId)}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 transition-opacity duration-200 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
          {shelves.map((shelf, index) => (
            <ShelfCard key={shelf._id} shelf={shelf} index={index} />
          ))}
        </div>
      )}

      {/* Add Shelf Modal */}
      <AddShelfModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
