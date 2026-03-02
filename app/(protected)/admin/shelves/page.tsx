'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shelvesApi, Shelf, getShelfPhotoUrl } from '@/lib/api/shelves';
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
import { Layers, Trash2, Search } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 20;

export default function AdminShelvesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteShelf, setDeleteShelf] = useState<Shelf | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-shelves'],
    queryFn: () => shelvesApi.adminGetAll(),
  });

  const filtered = items.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.userId.toLowerCase().includes(search.toLowerCase()),
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shelvesApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shelves'] });
      setDeleteShelf(null);
      toast.success('Полка удалена');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось удалить полку');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Все полки</h1>
          <p className="text-sm text-muted-foreground">Всего: {items.length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или userId..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {search ? `Найдено: ${filtered.length}` : 'Все полки'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Ничего не найдено' : 'Нет полок'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paged.map((s) => {
                const photoUrl = getShelfPhotoUrl(s.photo);
                return (
                  <div key={s._id} className="flex items-center gap-4 px-6 py-4">
                    {/* Photo */}
                    <div className="w-10 h-10 rounded-lg bg-muted border border-border shrink-0 overflow-hidden">
                      {photoUrl ? (
                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{s.name}</span>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        Пользователь: {s.userId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Растений: {s.plantIds?.length ?? 0} · Создана:{' '}
                        {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteShelf(s)}
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

      <AlertDialog open={!!deleteShelf} onOpenChange={(open) => !open && setDeleteShelf(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить полку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить полку <strong>{deleteShelf?.name}</strong>.
              Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteShelf && deleteMutation.mutate(deleteShelf._id)}
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
