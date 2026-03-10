'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { genusApi, Genus, CreateGenusDto } from '@/lib/api/genus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { BookOpen, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 20;

export default function AdminGenusPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editGenus, setEditGenus] = useState<Genus | null>(null);
  const [deleteGenus, setDeleteGenus] = useState<Genus | null>(null);
  const [form, setForm] = useState<CreateGenusDto>({ nameRu: '', nameEn: '', description: '' });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-genus'],
    queryFn: () => genusApi.getAll(),
  });

  const filtered = items.filter(
    (g) =>
      g.nameRu.toLowerCase().includes(search.toLowerCase()) ||
      g.nameEn.toLowerCase().includes(search.toLowerCase()),
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (data: CreateGenusDto) => genusApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genus'] });
      setCreateOpen(false);
      setForm({ nameRu: '', nameEn: '', description: '' });
      toast.success('Род создан');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось создать род');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGenusDto> }) =>
      genusApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genus'] });
      setEditGenus(null);
      toast.success('Род обновлён');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось обновить род');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => genusApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genus'] });
      setDeleteGenus(null);
      toast.success('Род удалён');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось удалить род');
    },
  });

  const openEdit = (g: Genus) => {
    setEditGenus(g);
    setForm({ nameRu: g.nameRu, nameEn: g.nameEn, description: g.description ?? '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Роды растений</h1>
            <p className="text-sm text-muted-foreground">Всего: {items.length}</p>
          </div>
        </div>
        <Button onClick={() => { setForm({ nameRu: '', nameEn: '', description: '' }); setCreateOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Создать род
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {search ? `Найдено: ${filtered.length}` : 'Все роды'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Ничего не найдено' : 'Нет родов'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paged.map((g) => (
                <div key={g._id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{g.nameRu}</span>
                      <span className="text-sm text-muted-foreground">/ {g.nameEn}</span>
                    </div>
                    {g.description && (
                      <p className="text-sm text-muted-foreground truncate">{g.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Создан: {new Date(g.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(g)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteGenus(g)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      {/* Create / Edit Dialog */}
      <Dialog
        open={createOpen || !!editGenus}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditGenus(null); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editGenus ? 'Редактировать род' : 'Создать род'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название (рус)</Label>
              <Input
                value={form.nameRu}
                onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
                placeholder="Монстера"
              />
            </div>
            <div className="space-y-2">
              <Label>Название (eng)</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                placeholder="Monstera"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Необязательно"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditGenus(null); }}>
              Отмена
            </Button>
            <Button
              disabled={!form.nameRu || !form.nameEn || createMutation.isPending || editMutation.isPending}
              onClick={() => {
                if (editGenus) {
                  editMutation.mutate({ id: editGenus._id, data: form });
                } else {
                  createMutation.mutate(form);
                }
              }}
            >
              {createMutation.isPending || editMutation.isPending
                ? 'Сохранение...'
                : editGenus ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteGenus} onOpenChange={(open) => !open && setDeleteGenus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить род?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить род <strong>{deleteGenus?.nameRu}</strong> ({deleteGenus?.nameEn}).
              Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGenus && deleteMutation.mutate(deleteGenus._id)}
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
