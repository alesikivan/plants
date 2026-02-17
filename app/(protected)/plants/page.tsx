'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Leaf } from 'lucide-react';
import { plantsApi, Plant } from '@/lib/api';
import { AddPlantModal } from '@/components/plants/AddPlantModal';
import { PlantCard } from '@/components/plants/PlantCard';
import { toast } from 'sonner';

export default function MyPlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    setIsLoading(true);
    try {
      const data = await plantsApi.getAll();
      setPlants(data);
    } catch (error) {
      toast.error('Ошибка загрузки растений');
      console.error('Failed to load plants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    loadPlants();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
        <div>
          <h1 className="text-3xl font-bold">Мои растения</h1>
          <p className="text-muted-foreground mt-1">
            Управляйте своей коллекцией растений
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-4 h-4" />
          Добавить растение
        </Button>
      </div>

      {/* Plants Grid */}
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
          <h3 className="text-xl font-semibold mb-2">У вас пока нет растений</h3>
          <p className="text-muted-foreground mb-6">
            Начните отслеживать свою коллекцию, добавив первое растение
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4" />
            Добавить первое растение
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {plants.map((plant, index) => (
            <PlantCard key={plant._id} plant={plant} index={index} />
          ))}
        </div>
      )}

      {/* Add Plant Modal */}
      <AddPlantModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
