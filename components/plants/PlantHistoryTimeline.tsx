'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, MessageSquare } from 'lucide-react';
import { PlantHistory, plantHistoryApi, getPlantHistoryPhotoUrl } from '@/lib/api';
import { toast } from 'sonner';
import { AddHistoryModal } from './AddHistoryModal';
import { PlantHistoryItem } from './PlantHistoryItem';

interface PlantHistoryTimelineProps {
  plantId: string;
}

export function PlantHistoryTimeline({ plantId }: PlantHistoryTimelineProps) {
  const [history, setHistory] = useState<PlantHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [plantId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await plantHistoryApi.getAll(plantId);
      setHistory(data);
    } catch (error) {
      toast.error('Ошибка загрузки истории');
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuccess = () => {
    loadHistory();
  };

  const handleEditSuccess = () => {
    loadHistory();
  };

  const handleDelete = async (historyId: string) => {
    try {
      await plantHistoryApi.delete(plantId, historyId);
      toast.success('Запись удалена');
      loadHistory();
    } catch (error) {
      toast.error('Ошибка при удалении записи');
      console.error('Failed to delete history:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Загрузка истории...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className=" fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '500ms' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle>История растения</CardTitle>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 transition-all hover:scale-105 active:scale-95"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Добавить запись
            </Button>
          </div>
          <CardDescription>
            {history.length > 0
              ? `Всего записей: ${history.length}`
              : 'История пока пуста'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <MessageSquare className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm">Добавьте первую запись в историю растения</p>
            </div>
          ) : (
            <div className="relative">
              {history.map((item, index) => (
                <PlantHistoryItem
                  key={item._id}
                  historyItem={item}
                  plantId={plantId}
                  onEditSuccess={handleEditSuccess}
                  onDelete={() => handleDelete(item._id)}
                  isLast={index === history.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddHistoryModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleAddSuccess}
        plantId={plantId}
      />
    </div>
  );
}
