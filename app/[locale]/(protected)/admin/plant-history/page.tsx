'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plantHistoryApi, PlantHistory, getPlantHistoryPhotoUrl } from '@/lib/api/plants';
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
import { History, Trash2, Search, Image, Eye } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 20;

export default function AdminPlantHistoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteEntry, setDeleteEntry] = useState<PlantHistory | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-plant-history'],
    queryFn: () => plantHistoryApi.adminGetAll(),
  });

  const filtered = items.filter(
    (h) =>
      h.comment?.toLowerCase().includes(search.toLowerCase()) ||
      h.plantId.toLowerCase().includes(search.toLowerCase()) ||
      h.userId.toLowerCase().includes(search.toLowerCase()),
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => plantHistoryApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plant-history'] });
      setDeleteEntry(null);
      toast.success('Запись удалена');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось удалить запись');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">История растений</h1>
          <p className="text-sm text-muted-foreground">Всего записей: {items.length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по комментарию, plantId или userId..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {search ? `Найдено: ${filtered.length}` : 'Все записи'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Ничего не найдено' : 'Нет записей'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paged.map((h) => {
                const firstPhoto = h.photos?.[0];
                const photoUrl = getPlantHistoryPhotoUrl(firstPhoto);
                return (
                  <div key={h._id} className="flex items-start gap-4 px-6 py-4">
                    {/* Photo preview */}
                    <div className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 overflow-hidden mt-0.5">
                      {photoUrl ? (
                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {new Date(h.date).toLocaleDateString('ru-RU')}
                        </span>
                        {h.photos?.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {h.photos.length} фото
                          </span>
                        )}
                      </div>
                      {h.comment && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{h.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        Растение: {h.plantId}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        Пользователь: {h.userId}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center shrink-0 gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/profile/${h.userId}/plants/${h.plantId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteEntry(h)}
                      >
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
      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      <AlertDialog open={!!deleteEntry} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись истории?</AlertDialogTitle>
            <AlertDialogDescription>
              Запись от{' '}
              <strong>
                {deleteEntry && new Date(deleteEntry.date).toLocaleDateString('ru-RU')}
              </strong>{' '}
              будет удалена вместе с фотографиями. Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteEntry && deleteMutation.mutate(deleteEntry._id)}
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
