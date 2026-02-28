'use client';

import { useState, useEffect } from 'react';
import { ComboBox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { genusApi, varietyApi, Genus, Variety } from '@/lib/api';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';
import { CreateGenusModal } from './CreateGenusModal';
import { CreateVarietyModal } from './CreateVarietyModal';

interface PlantSelectorProps {
  selectedGenusId: string;
  selectedVarietyId: string;
  onGenusChange: (genusId: string) => void;
  onVarietyChange: (varietyId: string) => void;
  allowCreate?: boolean;
  required?: boolean;
  genusError?: boolean;
}

export function PlantSelector({
  selectedGenusId,
  selectedVarietyId,
  onGenusChange,
  onVarietyChange,
  allowCreate = false,
  required = false,
  genusError = false,
}: PlantSelectorProps) {
  const [genuses, setGenuses] = useState<Genus[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [genusSearch, setGenusSearch] = useState('');
  const [varietySearch, setVarietySearch] = useState('');
  const [isLoadingGenuses, setIsLoadingGenuses] = useState(false);
  const [isLoadingVarieties, setIsLoadingVarieties] = useState(false);
  const [createGenusOpen, setCreateGenusOpen] = useState(false);
  const [createVarietyOpen, setCreateVarietyOpen] = useState(false);
  const [createGenusQuery, setCreateGenusQuery] = useState('');
  const [createVarietyQuery, setCreateVarietyQuery] = useState('');

  const debouncedGenusSearch = useDebounce(genusSearch, 300);
  const debouncedVarietySearch = useDebounce(varietySearch, 300);

  // Load genuses on mount and when search changes
  // No `open` guard needed — Radix Dialog unmounts this component on close, so state auto-resets
  useEffect(() => {
    loadGenuses(debouncedGenusSearch);
  }, [debouncedGenusSearch]);

  // Clear variety search when genus changes
  useEffect(() => {
    setVarietySearch('');
  }, [selectedGenusId]);

  // Load varieties when genus or variety search changes
  useEffect(() => {
    if (selectedGenusId) {
      loadVarieties(selectedGenusId, debouncedVarietySearch);
    } else {
      setVarieties([]);
    }
  }, [selectedGenusId, debouncedVarietySearch]);

  const loadGenuses = async (search?: string) => {
    setIsLoadingGenuses(true);
    try {
      const data = await genusApi.getAll(search);
      setGenuses(data);
    } catch (error) {
      toast.error('Ошибка загрузки родов растений');
      console.error('Failed to load genuses:', error);
    } finally {
      setIsLoadingGenuses(false);
    }
  };

  const loadVarieties = async (genusId: string, search?: string) => {
    setIsLoadingVarieties(true);
    try {
      const data = await varietyApi.getAll(genusId, search);
      setVarieties(data);
    } catch (error) {
      toast.error('Ошибка загрузки сортов растений');
      console.error('Failed to load varieties:', error);
    } finally {
      setIsLoadingVarieties(false);
    }
  };

  const handleCreateNewGenus = (searchValue: string) => {
    setCreateGenusQuery(searchValue);
    setCreateGenusOpen(true);
  };

  const handleGenusCreated = (genus: Genus) => {
    setGenuses((prev) => [...prev, genus]);
    onGenusChange(genus._id);
  };

  const handleCreateNewVariety = (searchValue: string) => {
    setCreateVarietyQuery(searchValue);
    setCreateVarietyOpen(true);
  };

  const handleVarietyCreated = (variety: Variety) => {
    setVarieties((prev) => [...prev, variety]);
    onVarietyChange(variety._id);
  };

  const getDisplayName = (nameRu: string, nameEn: string) => `${nameRu} / ${nameEn}`;

  const genusOptions = genuses.map((genus) => ({
    value: genus._id,
    label: getDisplayName(genus.nameRu, genus.nameEn),
  }));

  const varietyOptions = varieties.map((variety) => ({
    value: variety._id,
    label: getDisplayName(variety.nameRu, variety.nameEn),
  }));

  return (
    <>
      {allowCreate && (
        <>
          <CreateGenusModal
            open={createGenusOpen}
            onOpenChange={setCreateGenusOpen}
            initialQuery={createGenusQuery}
            onCreated={handleGenusCreated}
          />
          <CreateVarietyModal
            open={createVarietyOpen}
            onOpenChange={setCreateVarietyOpen}
            initialQuery={createVarietyQuery}
            genusId={selectedGenusId}
            onCreated={handleVarietyCreated}
          />
        </>
      )}
      <div className="grid gap-2">
        <Label htmlFor="genusId">
          Род растения {required && <span className="text-destructive">*</span>}
        </Label>
        <ComboBox
          options={genusOptions}
          value={selectedGenusId}
          onValueChange={onGenusChange}
          placeholder="Выберите род растения"
          searchPlaceholder="Поиск рода..."
          emptyText="Ничего не найдено"
          isLoading={isLoadingGenuses}
          onSearchChange={setGenusSearch}
          onCreateNew={allowCreate ? handleCreateNewGenus : undefined}
          createNewLabel="Создать род"
        />
        {genusError && (
          <p className="text-sm text-destructive">Это поле обязательно</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="varietyId">Сорт растения</Label>
        <ComboBox
          options={varietyOptions}
          value={selectedVarietyId}
          onValueChange={onVarietyChange}
          placeholder={!selectedGenusId ? 'Сначала выберите род' : 'Выберите сорт'}
          searchPlaceholder="Поиск сорта..."
          emptyText={varietySearch ? 'Ничего не найдено' : 'Нет доступных сортов'}
          isLoading={isLoadingVarieties}
          disabled={!selectedGenusId}
          onSearchChange={setVarietySearch}
          onCreateNew={allowCreate && selectedGenusId ? handleCreateNewVariety : undefined}
          createNewLabel="Создать сорт"
        />
      </div>
    </>
  );
}
