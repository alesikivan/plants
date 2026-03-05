'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/authStore';
import { usersApi } from '@/lib/api/users';
import { Role, UserResponse, AdminCreateUserDto, AdminUpdateUserDto } from '@/lib/types/user';
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
import { Shield, UserPlus, Pencil, Trash2, Ban, CheckCircle, Search, User } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { getAvatarUrl } from '@/lib/api/users';
import Image from 'next/image';

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Админ',
  [Role.MANAGER]: 'Менеджер',
  [Role.USER]: 'Пользователь',
};

const ROLE_BADGE_COLORS: Record<Role, string> = {
  [Role.ADMIN]: 'bg-red-100 text-red-700 border-red-200',
  [Role.MANAGER]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Role.USER]: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null);

  const [createForm, setCreateForm] = useState<AdminCreateUserDto>({
    email: '',
    password: '',
    name: '',
    role: Role.USER,
  });

  const [editForm, setEditForm] = useState<AdminUpdateUserDto>({});

  // Guard: only admins
  useEffect(() => {
    if (!initialized) return;
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/dashboard');
    }
  }, [user, initialized, router]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: usersApi.getAllUsers,
    enabled: !!user && user.role === Role.ADMIN,
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: (data: AdminCreateUserDto) => usersApi.adminCreateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateOpen(false);
      setCreateForm({ email: '', password: '', name: '', role: Role.USER });
      toast.success('Пользователь создан');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось создать пользователя');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateUserDto }) =>
      usersApi.adminUpdateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditUser(null);
      toast.success('Пользователь обновлён');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось обновить пользователя');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.adminDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteUser(null);
      toast.success('Пользователь удалён');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось удалить пользователя');
    },
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, isBlocked }: { id: string; isBlocked: boolean }) =>
      usersApi.adminUpdateUser(id, { isBlocked }),
    onSuccess: (_, { isBlocked }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(isBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Не удалось изменить статус блокировки');
    },
  });

  const openEdit = (u: UserResponse) => {
    setEditUser(u);
    setEditForm({ email: u.email, name: u.name, role: u.role });
  };

  if (!initialized || !user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Управление пользователями</h1>
            <p className="text-sm text-muted-foreground">
              Всего: {users.length} пользователей
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 w-full sm:w-auto">
          <UserPlus className="w-4 h-4" />
          Создать пользователя
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {search ? `Найдено: ${filteredUsers.length}` : 'Все пользователи'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Пользователи не найдены' : 'Нет пользователей'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pagedUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
                >
                  <div className="flex items-center gap-3 w-full min-w-0 sm:flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                      {u.avatar ? (
                        <Image
                          src={getAvatarUrl(u.avatar)!}
                          alt={u.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-sm font-semibold text-primary">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{u.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            ROLE_BADGE_COLORS[u.role]
                          }`}
                        >
                          {ROLE_LABELS[u.role]}
                        </span>
                        {u.isBlocked && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-destructive/10 text-destructive border-destructive/20 font-medium">
                            Заблокирован
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Зарегистрирован:{' '}
                        {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-1 w-full sm:flex sm:w-auto sm:justify-end sm:gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full sm:w-9"
                      title="Открыть профиль"
                      onClick={() => router.push(`/profile/${u.id}`)}
                    >
                      <User className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full sm:w-9"
                      title={u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                      disabled={u.id === user.id || blockMutation.isPending}
                      onClick={() =>
                        blockMutation.mutate({ id: u.id, isBlocked: !u.isBlocked })
                      }
                    >
                      {u.isBlocked ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Ban className="w-4 h-4 text-orange-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full sm:w-9"
                      title="Редактировать"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full sm:w-9"
                      title="Удалить"
                      disabled={u.id === user.id}
                      onClick={() => setDeleteUser(u)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} pageSize={PAGE_SIZE} total={filteredUsers.length} onPageChange={setPage} />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Имя</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="nicknameнов"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Пароль</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Минимум 6 символов"
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v as Role }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.USER}>Пользователь</SelectItem>
                  <SelectItem value={Role.MANAGER}>Менеджер</SelectItem>
                  <SelectItem value={Role.ADMIN}>Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={
                createMutation.isPending ||
                !createForm.email ||
                !createForm.password ||
                !createForm.name
              }
            >
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Имя</Label>
              <Input
                id="edit-name"
                value={editForm.name ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as Role }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.USER}>Пользователь</SelectItem>
                  <SelectItem value={Role.MANAGER}>Менеджер</SelectItem>
                  <SelectItem value={Role.ADMIN}>Админ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Отмена
            </Button>
            <Button
              onClick={() =>
                editUser && editMutation.mutate({ id: editUser.id, data: editForm })
              }
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь удалить аккаунт{' '}
              <strong>{deleteUser?.name}</strong> ({deleteUser?.email}).
              Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
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
