'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plant } from '@/lib/api';
import { PlantCard } from './PlantCard';
import { GripVertical } from 'lucide-react';

interface SortablePlantCardProps {
  plant: Plant;
}

export function SortablePlantCard({ plant }: SortablePlantCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: plant._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <div className="relative">
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 z-10 bg-background/80 backdrop-blur-sm rounded-md p-1 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <PlantCard plant={plant} />
      </div>
    </div>
  );
}
