'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Plant, Genus, Variety, getPlantPhotoUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { useLocale } from 'next-intl';
import { getDisplayName } from '@/lib/utils/language';
import { Leaf, Archive } from 'lucide-react';
import Link from 'next/link';

interface PlantCardProps {
  plant: Plant;
  index?: number;
  href?: string;
}

export function PlantCard({ plant, index = 0, href }: PlantCardProps) {
  const user = useAuthStore((state) => state.user);
  const locale = useLocale();
  const language = user?.preferredLanguage || locale;

  const genus = typeof plant.genusId === 'object' ? plant.genusId : null;
  const variety = typeof plant.varietyId === 'object' ? plant.varietyId : null;

  const genusName = getDisplayName(genus, language);
  const varietyName = getDisplayName(variety, language);

  const photoUrl = getPlantPhotoUrl(plant.photo);

  return (
    <Link href={href ?? `/plants/${plant._id}`}>
      <div className="group">
        <div className="aspect-square relative bg-background rounded-lg overflow-hidden mb-3 shadow-sm">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={genusName || 'Noname'}
              className={`w-full h-full object-cover${plant.isArchived ? ' opacity-50' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <Leaf className={`w-16 h-16${plant.isArchived ? ' text-muted-foreground/10' : ' text-muted-foreground/20'}`} />
            </div>
          )}
          {plant.isArchived && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 rounded-full p-2">
                <Archive className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-medium text-sm text-foreground/90">
            {genusName || 'Noname'}
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
