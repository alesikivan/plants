'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Leaf } from 'lucide-react';
import { usersApi, Plant } from '@/lib/api';
import { PlantCard } from '@/components/plants/PlantCard';
import { toast } from 'sonner';

export default function UserPlantsClient() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    usersApi.getUserPlants(userId)
      .then(setPlants)
      .catch(() => toast.error('Ошибка загрузки растений'))
      .finally(() => setIsLoading(false));
  }, [userId]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Растения</h1>
          <p className="text-muted-foreground text-sm">Коллекция пользователя</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <Leaf className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
            <p className="text-muted-foreground">Загрузка растений...</p>
          </div>
        </div>
      ) : plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <Leaf className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Нет растений</h3>
          <p className="text-muted-foreground">У этого пользователя пока нет растений</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {plants.map((plant, index) => (
            <PlantCard
              key={plant._id}
              plant={plant}
              index={index}
              href={`/profile/${userId}/plants/${plant._id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
