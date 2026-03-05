'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, Heart, Plus } from 'lucide-react';
import { wishlistApi, Wishlist } from '@/lib/api';
import { WishlistCard, AddWishlistModal } from '@/components/wishlist';
import { toast } from 'sonner';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const data = await wishlistApi.getAll();
      setWishlist(data);
    } catch (error) {
      toast.error('Ошибка загрузки списка желаний');
      console.error('Failed to load wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Quick Actions */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <h2 className="text-2xl font-bold mb-4">Быстрые действия</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => router.push('/plants')}
            className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left group active:scale-95"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Добавить растение</h3>
              <p className="text-sm text-muted-foreground">Начните отслеживать новое растение</p>
            </div>
          </button>
        </div>
      </div>

      {/* Wishlist Section */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Список желаний</h2>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className='mr-2'>
            <Plus className="w-4 h-4" />
            <span className='hidden sm:block'>Добавить</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : wishlist.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Список желаний пуст</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Добавьте растения, которые хотите приобрести
              </p>
              <Button onClick={() => setIsAddModalOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Добавить растение
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {wishlist.map((item) => (
              <WishlistCard
                key={item._id}
                wishlistItem={item}
                onUpdate={loadWishlist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Wishlist Modal */}
      <AddWishlistModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={loadWishlist}
      />
    </div>
  );
}
