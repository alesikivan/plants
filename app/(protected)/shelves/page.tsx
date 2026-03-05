'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';
import { shelvesApi, Shelf } from '@/lib/api';
import { AddShelfModal } from '@/components/shelves/AddShelfModal';
import { ShelfCard } from '@/components/shelves/ShelfCard';
import { toast } from 'sonner';

export default function ShelvesPage() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadShelves();
  }, []);

  const loadShelves = async () => {
    setIsLoading(true);
    try {
      const data = await shelvesApi.getAll();
      setShelves(data);
    } catch (error) {
      toast.error('Ошибка загрузки полок');
      console.error('Failed to load shelves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    loadShelves();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Мои полки</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Организуйте свои<br className="sm:hidden" /> растения по полкам
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 transition-all active:scale-95 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Создать полку
        </Button>
      </div>

      {/* Shelves Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <Layers className="w-12 h-12 text-primary/50 animate-pulse mx-auto" />
            <p className="text-muted-foreground">Загрузка полок...</p>
          </div>
        </div>
      ) : shelves.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in-95 duration-700">
          <Layers className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">У вас пока нет полок</h3>
          <p className="text-muted-foreground mb-6">
            Создайте свою первую полку, чтобы организовать растения
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Создать первую полку
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {shelves.map((shelf, index) => (
            <ShelfCard key={shelf._id} shelf={shelf} index={index} />
          ))}
        </div>
      )}

      {/* Add Shelf Modal */}
      <AddShelfModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
