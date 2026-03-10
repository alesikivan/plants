'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { varietyApi, Variety, CreateVarietyDto } from '@/lib/api/variety';
import { genusApi, Genus } from '@/lib/api/genus';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComboBox } from '@/components/ui/combobox';
import { useDebounce } from '@/lib/hooks/useDebounce';
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
import { Tag, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

const PAGE_SIZE = 20;

export default function AdminVarietyPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [genusFilter, setGenusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editVariety, setEditVariety] = useState<Variety | null>(null);
  const [deleteVariety, setDeleteVariety] = useState<Variety | null>(null);
  const [genusSearch, setGenusSearch] = useState('');
  const [form, setForm] = useState<CreateVarietyDto>({ nameRu: '', nameEn: '', genusId: '', description: '' });

  const debouncedGenusSearch = useDebounce(genusSearch, 300);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-variety', genusFilter],
    queryFn: () => varietyApi.getAll(genusFilter === 'all' ? undefined : genusFilter || undefined),
  });

  const { data: genera = [], isLoading: isGenusLoading } = useQuery({
    queryKey: ['admin-genus', debouncedGenusSearch],
    queryFn: () => genusApi.getAll(debouncedGenusSearch),
    enabled: true,
  });

  const filtered = items.filter(
    (v) =>
      v.nameRu.toLowerCase().includes(search.toLowerCase()) ||
      v.nameEn.toLowerCase().includes(search.toLowerCase()),
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getGenusName = (genusId: string | Genus) => {
    if (typeof genusId === 'object') return genusId.nameRu;
    const g = genera.find((g) => g._id === genusId);
    return g?.nameRu ?? genusId;
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateVarietyDto) => varietyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-variety'] });
      setCreateOpen(false);
      setForm({ nameRu: '', nameEn: '', genusId: '', description: '' });
      toast.success('Сорт создан');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось создать сорт');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVarietyDto> }) =>
      varietyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-variety'] });
      setEditVariety(null);
      toast.success('Сорт обновлён');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось обновить сорт');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => varietyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-variety'] });
      setDeleteVariety(null);
      toast.success('Сорт удалён');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось удалить сорт');
    },
  });

  const openEdit = (v: Variety) => {
    setEditVariety(v);
    const genusId = typeof v.genusId === 'object' ? v.genusId._id : v.genusId;
    setForm({ nameRu: v.nameRu, nameEn: v.nameEn, genusId, description: v.description ?? '' });
    setGenusSearch('');
  };

  const genusOptions = genera.map((g) => ({
    value: g._id,
    label: `${g.nameRu} / ${g.nameEn}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Сорта растений</h1>
            <p className="text-sm text-muted-foreground">Всего: {items.length}</p>
          </div>
        </div>
        <Button onClick={() => { setForm({ nameRu: '', nameEn: '', genusId: '', description: '' }); setGenusSearch(''); setCreateOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Создать сорт
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={genusFilter || 'all'} onValueChange={(v) => { setGenusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Все роды" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роды</SelectItem>
            {genera.map((g) => (
              <SelectItem key={g._id} value={g._id}>
                {g.nameRu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {search || genusFilter ? `Найдено: ${filtered.length}` : 'Все сорта'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search || genusFilter ? 'Ничего не найдено' : 'Нет сортов'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {paged.map((v) => (
                <div key={v._id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{v.nameRu}</span>
                      <span className="text-sm text-muted-foreground">/ {v.nameEn}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Род: {getGenusName(v.genusId)}
                    </p>
                    {v.description && (
                      <p className="text-sm text-muted-foreground truncate">{v.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Создан: {new Date(v.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteVariety(v)}>
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
        open={createOpen || !!editVariety}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditVariety(null); setGenusSearch(''); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editVariety ? 'Редактировать сорт' : 'Создать сорт'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название (рус)</Label>
              <Input
                value={form.nameRu}
                onChange={(e) => setForm((f) => ({ ...f, nameRu: e.target.value }))}
                placeholder="Деликатесса"
              />
            </div>
            <div className="space-y-2">
              <Label>Название (eng)</Label>
              <Input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                placeholder="Deliciosa"
              />
            </div>
            <div className="space-y-2">
              <Label>Род</Label>
              <ComboBox
                options={genusOptions}
                value={form.genusId}
                onValueChange={(v) => setForm((f) => ({ ...f, genusId: v }))}
                placeholder="Выберите род"
                searchPlaceholder="Поиск рода..."
                emptyText="Роды не найдены"
                isLoading={isGenusLoading}
                onSearchChange={setGenusSearch}
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
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditVariety(null); }}>
              Отмена
            </Button>
            <Button
              disabled={!form.nameRu || !form.nameEn || !form.genusId || createMutation.isPending || editMutation.isPending}
              onClick={() => {
                if (editVariety) {
                  editMutation.mutate({ id: editVariety._id, data: form });
                } else {
                  createMutation.mutate(form);
                }
              }}
            >
              {createMutation.isPending || editMutation.isPending
                ? 'Сохранение...'
                : editVariety ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteVariety} onOpenChange={(open) => !open && setDeleteVariety(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сорт?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить сорт <strong>{deleteVariety?.nameRu}</strong>.
              Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteVariety && deleteMutation.mutate(deleteVariety._id)}
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
