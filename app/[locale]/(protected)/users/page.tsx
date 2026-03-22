'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Leaf, Layers, Search, Users as UsersIcon, X, ArrowUpDown, Clock, History, TrendingUp } from 'lucide-react';
import { usersApi, UserProfileWithStats } from '@/lib/api';
import { getAvatarUrl } from '@/lib/api/users';
import Image from 'next/image';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

type SortOption = 'newest' | 'oldest' | 'mostPlants';

export default function UsersPage() {
  const router = useRouter();
  const t = useTranslations('UsersPage');
  const [users, setUsers] = useState<UserProfileWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('mostPlants');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (query?: string, sort?: SortOption) => {
    setIsLoading(true);
    try {
      const data = await usersApi.searchUsers(query, sort || sortBy);
      setUsers(data);
    } catch (error) {
      toast.error(t('error'));
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) trackEvent('users_searched', { query_length: searchQuery.length });
    setIsSearching(true);
    loadUsers(searchQuery);
  };

  const handleClearSearch = () => {
    trackEvent('users_search_cleared');
    setSearchQuery('');
    setIsSearching(true);
    loadUsers();
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    trackEvent('users_sorted', { sort: value });
    loadUsers(searchQuery, value);
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <UsersIcon className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
          <p className="text-muted-foreground">{t('search.loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('header.title')}</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {t('header.description')}
          </p>
        </div>

        {/* Search Bar + Sort */}
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? t('search.loading') : t('search.submit')}
            </Button>
          </form>

          <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortOption)}>
            <SelectTrigger className="h-11 w-11 justify-center px-0 rounded-xl shrink-0 [&>svg:last-child]:hidden">
              <ArrowUpDown className="w-4 h-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" textValue={t('sort.newest')}>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  {t('sort.newest')}
                </span>
              </SelectItem>
              <SelectItem value="oldest" textValue={t('sort.oldest')}>
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 shrink-0" />
                  {t('sort.oldest')}
                </span>
              </SelectItem>
              <SelectItem value="mostPlants" textValue={t('sort.mostPlants')}>
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  {t('sort.mostPlants')}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Grid */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery ? t('empty.notFound') : t('empty.noUsers')}
            </p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                {t('empty.tryChanging')}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 !mt-2">
          {users.map((user) => (
            <Card
              key={user.id}
              className="transition-all hover:border-primary/50 cursor-pointer p-3"
              onClick={() => { trackEvent('user_profile_visited', { from: 'users_page' }); router.push(`/profile/${user.id}`); }}
            >
              <div className="flex items-center justify-between space-x-3">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center flex-shrink-0">
                    {user.avatar ? (
                      <Image
                        src={getAvatarUrl(user.avatar)!}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate" title={user.name}>
                      {user.name.length > 16 ? `${user.name.slice(0, 16)}...` : user.name}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Leaf className="w-4 h-4" />
                    <span>{user.stats.totalPlants}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>{user.stats.totalShelves}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{user.stats.followersCount}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
