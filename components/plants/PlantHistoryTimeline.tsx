'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, MessageSquare } from 'lucide-react';
import { PlantHistory, plantHistoryApi, getPlantHistoryPhotoUrl } from '@/lib/api';
import { toast } from 'sonner';
import { AddHistoryModal } from './AddHistoryModal';
import { PlantHistoryItem } from './PlantHistoryItem';

interface PlantHistoryTimelineProps {
  plantId: string;
  isPublic?: boolean;
  initialHistory?: PlantHistory[];
}

export function PlantHistoryTimeline({
  plantId,
  isPublic = false,
  initialHistory = [],
}: PlantHistoryTimelineProps) {
  const t = useTranslations('PlantHistoryTimeline');
  const [history, setHistory] = useState<PlantHistory[]>(initialHistory);
  const [isLoading, setIsLoading] = useState(initialHistory.length === 0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (initialHistory.length > 0) return;
    loadHistory();
  }, [initialHistory.length, plantId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = isPublic
        ? await plantHistoryApi.getPublic(plantId)
        : await plantHistoryApi.getAll(plantId);
      setHistory(data);
    } catch (error) {
      toast.error(t('loadError'));
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
      toast.success(t('deleteSuccess'));
      loadHistory();
    } catch (error) {
      toast.error(t('deleteError'));
      console.error('Failed to delete history:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">{t('loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '500ms' }}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{t('title')}</CardTitle>
              <CardDescription className="mt-1">
                {history.length > 0
                  ? t('total', { count: history.length })
                  : t('empty')}
              </CardDescription>
            </div>
            {!isPublic && (
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 transition-all active:scale-95 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                {t('addButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <MessageSquare className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-sm">{t('emptyMessage')}</p>
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
                  isPublic={isPublic}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!isPublic && (
        <AddHistoryModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSuccess={handleAddSuccess}
          plantId={plantId}
        />
      )}
    </div>
  );
}
