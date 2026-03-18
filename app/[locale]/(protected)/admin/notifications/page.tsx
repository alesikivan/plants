'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Search, X, Send, Users, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { adminApi } from '@/lib/api/admin';
import { usersApi } from '@/lib/api/users';
import { getAvatarUrl } from '@/lib/api/users';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from 'sonner';

interface UserOption {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientMode, setRecipientMode] = useState<'all' | 'selected'>('all');
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usersApi.getAllUsers().then((users) => {
      setAllUsers(
        users.map((u) => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar })),
      );
    });
  }, []);

  const filteredUsers = search.trim()
    ? allUsers.filter(
        (u) =>
          !selectedUsers.some((s) => s.id === u.id) &&
          (u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())),
      )
    : [];

  const addUser = (user: UserOption) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearch('');
    searchRef.current?.focus();
  };

  const removeUser = (id: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Заполните заголовок и сообщение');
      return;
    }
    if (recipientMode === 'selected' && selectedUsers.length === 0) {
      toast.error('Выберите хотя бы одного пользователя');
      return;
    }

    setSending(true);
    setSentCount(null);
    try {
      const userIds = recipientMode === 'selected' ? selectedUsers.map((u) => u.id) : undefined;
      const { sent } = await adminApi.broadcastNotification(title, message, userIds);
      setSentCount(sent);
      setTitle('');
      setMessage('');
      setSelectedUsers([]);
      toast.success(`Отправлено ${sent} пользователям`);
    } catch {
      toast.error('Ошибка при отправке уведомлений');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Рассылка уведомлений</h1>
          <p className="text-sm text-muted-foreground">Системные уведомления для пользователей</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-title">Заголовок</Label>
          <Input
            id="notif-title"
            placeholder="Например: Новая функция"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label htmlFor="notif-message">Сообщение</Label>
          <Textarea
            id="notif-message"
            placeholder="Текст уведомления..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Recipient mode */}
        <div className="space-y-3">
          <Label>Получатели</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setRecipientMode('all')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                recipientMode === 'all'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              <Users className="w-4 h-4" />
              Все пользователи
              {recipientMode === 'all' && allUsers.length > 0 && (
                <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                  {allUsers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setRecipientMode('selected')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                recipientMode === 'selected'
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              <User className="w-4 h-4" />
              Выбрать
              {selectedUsers.length > 0 && (
                <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                  {selectedUsers.length}
                </span>
              )}
            </button>
          </div>

          {/* User selector */}
          {recipientMode === 'selected' && (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Поиск по имени или email..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Search results */}
              {filteredUsers.length > 0 && (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  {filteredUsers.slice(0, 8).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => addUser(user)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0 text-left"
                    >
                      <UserAvatar user={user} size={28} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm"
                    >
                      <UserAvatar user={user} size={20} />
                      <span className="font-medium text-primary">{user.name}</span>
                      <button
                        onClick={() => removeUser(user.id)}
                        className="text-primary/60 hover:text-primary transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedUsers.length === 0 && search === '' && (
                <p className="text-sm text-muted-foreground">
                  Начните вводить имя или email для поиска
                </p>
              )}
            </div>
          )}
        </div>

        {/* Send button */}
        <div className="flex items-center justify-between pt-1">
          {sentCount !== null ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              Отправлено {sentCount} пользователям
            </div>
          ) : (
            <div />
          )}
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="w-4 h-4" />
            {sending ? 'Отправка...' : 'Отправить'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserAvatar({ user, size }: { user: UserOption; size: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"
    >
      {user.avatar ? (
        <Image
          src={getAvatarUrl(user.avatar)!}
          alt={user.name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <User className={cn('text-primary')} style={{ width: size * 0.5, height: size * 0.5 }} />
      )}
    </div>
  );
}
