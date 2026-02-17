'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User, Shield, Calendar, Leaf, Layers, Search, Users as UsersIcon } from 'lucide-react';
import { usersApi, UserProfileWithStats } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfileWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (query?: string) => {
    setIsLoading(true);
    try {
      const data = await usersApi.searchUsers(query);
      setUsers(data);
    } catch (error) {
      toast.error('Ошибка загрузки пользователей');
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    loadUsers(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadUsers();
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <UsersIcon className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Пользователи</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Найдите и просмотрите профили пользователей
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск по имени пользователя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? 'Поиск...' : 'Найти'}
          </Button>
          {searchQuery && (
            <Button type="button" variant="outline" onClick={handleClearSearch}>
              Очистить
            </Button>
          )}
        </form>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {searchQuery ? (
          <p>Найдено пользователей: {users.length}</p>
        ) : (
          <p>Всего пользователей: {users.length}</p>
        )}
      </div>

      {/* Users Grid */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery ? 'Пользователи не найдены' : 'Нет пользователей'}
            </p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Попробуйте изменить параметры поиска
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card
              key={user.id}
              className="transition-all hover:shadow-lg cursor-pointer"
              onClick={() => router.push(`/profile/${user.id}`)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 flex-shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{user.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Leaf className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-lg font-bold">{user.stats.totalPlants}</p>
                      <p className="text-xs text-muted-foreground">Растений</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-lg font-bold">{user.stats.totalShelves}</p>
                      <p className="text-xs text-muted-foreground">Полок</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
