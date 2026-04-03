'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plantsApi, Plant, getPlantPhotoUrl } from '@/lib/api/plants';
import { Genus } from '@/lib/api/genus';
import { Variety } from '@/lib/api/variety';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FileInput } from '@/components/ui/file-input';
import { PlantSelector } from '@/components/plants/PlantSelector';
import { toast } from 'sonner';
import { Leaf, Trash2, Search, Eye, Pencil } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 20;

interface AdminEditFormData {
  description?: string;
}

function AdminEditPlantModal({
  open,
  plant,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  plant: Plant | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [selectedGenusId, setSelectedGenusId] = useState('');
  const [selectedVarietyId, setSelectedVarietyId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm<AdminEditFormData>();

  useEffect(() => {
    if (open && plant) {
      setSelectedGenusId(typeof plant.genusId === 'object' ? plant.genusId._id : plant.genusId);
      setSelectedVarietyId(
        typeof plant.varietyId === 'object' ? plant.varietyId?._id || '' : plant.varietyId || '',
      );
      setPurchaseDate(plant.purchaseDate ? new Date(plant.purchaseDate) : undefined);
      setPhotoPreview(plant.photo ? getPlantPhotoUrl(plant.photo) || null : null);
      setSelectedFile(null);
      reset({ description: plant.description || '' });
    }
  }, [open, plant]);

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedGenusId('');
      setSelectedVarietyId('');
      setPurchaseDate(undefined);
      setPhotoPreview(null);
      setSelectedFile(null);
    }
  }, [open, reset]);

  const onSubmit = async (data: AdminEditFormData) => {
    if (!plant) return;
    setIsLoading(true);
    try {
      await plantsApi.adminUpdate(plant._id, {
        genusId: selectedGenusId,
        varietyId: selectedVarietyId || undefined,
        removeVariety: !selectedVarietyId,
        purchaseDate: purchaseDate ? purchaseDate.toISOString() : undefined,
        photo: selectedFile || undefined,
        description: data.description || undefined,
      });
      toast.success('Растение обновлено');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error('Не удалось обновить растение');
      console.error('Failed to update plant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const disableFutureDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  if (!plant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать растение</DialogTitle>
          <DialogDescription>
            Редактирование растения пользователя{' '}
            <span className="font-mono text-xs">{plant.userId}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <PlantSelector
              selectedGenusId={selectedGenusId}
              selectedVarietyId={selectedVarietyId}
              onGenusChange={(id) => {
                setSelectedGenusId(id);
                setSelectedVarietyId('');
              }}
              onVarietyChange={setSelectedVarietyId}
              allowCreate
              required
            />

            <div className="grid gap-2">
              <Label>Дата покупки</Label>
              <DatePicker
                date={purchaseDate}
                onDateChange={setPurchaseDate}
                placeholder="Выберите дату"
                disabledMatcher={disableFutureDates}
              />
            </div>

            <div className="grid gap-2">
              <Label>Фото</Label>
              <FileInput
                id="admin-plant-photo"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif"
                onFileChange={handleFileChange}
                preview={photoPreview}
                onRemove={() => handleFileChange(null)}
                maxSize={5 * 1024 * 1024}
                acceptedFormats={['JPG', 'PNG', 'GIF', 'WebP', 'HEIC']}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="admin-plant-description">Описание</Label>
              <Textarea
                id="admin-plant-description"
                placeholder="Описание растения"
                {...register('description')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading || !selectedGenusId}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPlantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deletePlant, setDeletePlant] = useState<Plant | null>(null);
  const [editPlant, setEditPlant] = useState<Plant | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-plants'],
    queryFn: () => plantsApi.adminGetAll(),
  });

  const getGenusName = (genusId: string | Genus) => {
    if (typeof genusId === 'object') return genusId.nameRu;
    return genusId;
  };

  const getVarietyName = (varietyId?: string | Variety) => {
    if (!varietyId) return null;
    if (typeof varietyId === 'object') return varietyId.nameRu;
    return varietyId;
  };

  const filtered = items.filter((p) => {
    const genus = getGenusName(p.genusId).toLowerCase();
    const variety = getVarietyName(p.varietyId)?.toLowerCase() ?? '';
    const s = search.toLowerCase();
    return genus.includes(s) || variety.includes(s) || p.userId.includes(s);
  });
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => plantsApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plants'] });
      setDeletePlant(null);
      toast.success('Растение удалено');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось удалить растение');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Все растения</h1>
          <p className="text-sm text-muted-foreground">Всего: {items.length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по роду, сорту или userId..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {search ? `Найдено: ${filtered.length}` : 'Все растения'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Ничего не найдено' : 'Нет растений'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paged.map((p) => {
                const photoUrl = getPlantPhotoUrl(p.photo);
                const variety = getVarietyName(p.varietyId);
                return (
                  <div key={p._id} className="flex items-center gap-4 px-6 py-4">
                    {/* Photo */}
                    <div className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 overflow-hidden">
                      {photoUrl ? (
                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{getGenusName(p.genusId)}</span>
                        {variety && (
                          <span className="text-sm text-muted-foreground">{variety}</span>
                        )}
                        {p.isArchived && (
                          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            архив
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        Пользователь: {p.userId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Добавлено: {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                        {p.purchaseDate &&
                          ` · Куплено: ${new Date(p.purchaseDate).toLocaleDateString('ru-RU')}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/profile/${p.userId}/plants/${p._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditPlant(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletePlant(p)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />

      <AdminEditPlantModal
        open={!!editPlant}
        plant={editPlant}
        onOpenChange={(open) => !open && setEditPlant(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-plants'] });
        }}
      />

      <AlertDialog open={!!deletePlant} onOpenChange={(open) => !open && setDeletePlant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить растение?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить растение{' '}
              <strong>{deletePlant && getGenusName(deletePlant.genusId)}</strong>.
              Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePlant && deleteMutation.mutate(deletePlant._id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
