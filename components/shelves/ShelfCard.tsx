'use client';

import { Shelf, getShelfPhotoUrl, getPlantPhotoUrl } from '@/lib/api';
import { Layers, Leaf } from 'lucide-react';
import Link from 'next/link';

interface ShelfCardProps {
  shelf: Shelf;
  index?: number;
  href?: string;
}

export function ShelfCard({ shelf, index = 0, href }: ShelfCardProps) {
  const shelfPhotoUrl = getShelfPhotoUrl(shelf.photo);
  const plants = shelf.plants || [];
  const plantPhotos = plants
    .map(plant => getPlantPhotoUrl(plant.photo))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <Link href={href ?? `/shelves/${shelf._id}`}>
      <div className="group">
        <div className="aspect-square relative bg-background rounded-lg overflow-hidden mb-3 shadow-sm">
          {shelfPhotoUrl ? (
            <img
              src={shelfPhotoUrl}
              alt={shelf.name}
              className="w-full h-full object-cover"
            />
          ) : plantPhotos.length > 0 ? (
            <div className="w-full h-full flex items-center justify-center p-2 bg-gradient-to-br from-muted/5 to-muted/20">
              <div className="relative w-full h-full">
                {plantPhotos.map((photoUrl, idx) => {
                  const totalCards = plantPhotos.length;
                  // Создаем эффект веера - центральная карта прямо, остальные по бокам
                  const rotationAngle = totalCards === 1 ? 0 :
                    totalCards === 2 ? (idx === 0 ? -12 : 12) :
                    (idx - 1) * 15; // -15, 0, 15 для трех карт

                  const horizontalOffset = totalCards === 1 ? 50 :
                    totalCards === 2 ? (idx === 0 ? 35 : 65) :
                    [30, 50, 70][idx]; // Позиции слева направо

                  const verticalOffset = totalCards === 1 ? 50 :
                    Math.abs(idx - (totalCards - 1) / 2) * 8 + 45; // Центральная карта ниже

                  return (
                    <div
                      key={idx}
                      className="absolute rounded-lg overflow-hidden shadow-xl border-4 border-white transition-transform duration-300 hover:scale-105"
                      style={{
                        width: '55%',
                        height: '75%',
                        left: `${horizontalOffset}%`,
                        top: `${verticalOffset}%`,
                        transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)`,
                        zIndex: totalCards === 3 && idx === 1 ? 10 : totalCards - idx,
                      }}
                    >
                      <img
                        src={photoUrl}
                        alt={`Plant ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <Layers className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}

          {(shelf.plantsCount || plants.length) > 0 && (
            <div style={{zIndex: 10}} className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 shadow-sm">
              <Leaf className="w-3 h-3" />
              {shelf.plantsCount || plants.length}
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-medium text-sm text-foreground/90">
            {shelf.name}
          </h3>
        </div>
      </div>
    </Link>
  );
}
