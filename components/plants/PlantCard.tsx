'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Plant, Genus, Variety, getPlantPhotoUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { getDisplayName } from '@/lib/utils/language';
import { Leaf } from 'lucide-react';
import Link from 'next/link';

interface PlantCardProps {
  plant: Plant;
  index?: number;
}

export function PlantCard({ plant, index = 0 }: PlantCardProps) {
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage || 'ru';

  const genus = typeof plant.genusId === 'object' ? plant.genusId : null;
  const variety = typeof plant.varietyId === 'object' ? plant.varietyId : null;

  const genusName = getDisplayName(genus, language);
  const varietyName = getDisplayName(variety, language);

  const photoUrl = getPlantPhotoUrl(plant.photo);

  return (
    <Link href={`/plants/${plant._id}`}>
      <div className="group">
        <div className="aspect-square relative bg-background rounded-lg overflow-hidden mb-3 shadow-sm">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={genusName || 'Растение'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <Leaf className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-medium text-sm text-foreground/90">
            {genusName || 'Без названия'}
          </h3>
          {varietyName && (
            <p className="text-xs text-muted-foreground">
              {varietyName}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
