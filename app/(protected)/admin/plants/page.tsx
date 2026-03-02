'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plantsApi, Plant, getPlantPhotoUrl } from '@/lib/api/plants';
import { Genus } from '@/lib/api/genus';
import { Variety } from '@/lib/api/variety';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Leaf, Trash2, Search } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 20;

export default function AdminPlantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deletePlant, setDeletePlant] = useState<Plant | null>(null);

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
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        Пользователь: {p.userId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Добавлено: {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                        {p.purchaseDate && ` · Куплено: ${new Date(p.purchaseDate).toLocaleDateString('ru-RU')}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletePlant(p)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

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
