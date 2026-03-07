'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Leaf, Clock, BookOpen, User } from 'lucide-react';
import {
  FeedItem,
  FeedPlantItem,
  FeedHistoryItem,
  FeedGenus,
  FeedVariety,
  getFeedPlantPhotoUrl,
  getFeedHistoryPhotoUrl,
  getFeedAvatarUrl,
} from '@/lib/api/feed';

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'только что';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} нед. назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} мес. назад`;
  return `${Math.floor(months / 12)} г. назад`;
}

function getPlantName(
  genus: FeedGenus,
  variety: FeedVariety | undefined,
  language: string,
): string {
  const genusName = language === 'ru' ? genus.nameRu : genus.nameEn;
  const varietyName = variety ? (language === 'ru' ? variety.nameRu : variety.nameEn) : null;
  return varietyName ? `${genusName} · ${varietyName}` : genusName;
}

interface UserRowProps {
  user: { _id: string; name: string; avatar?: string };
  action: string;
  timeAgo: string;
  isNew: boolean;
}

function UserRow({ user, action, timeAgo, isNew }: UserRowProps) {
  const avatarUrl = getFeedAvatarUrl(user.avatar);
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      {isNew && (
        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-primary" />
      )}
      <Link
        href={`/profile/${user._id}`}
        className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={user.name}
            width={36}
            height={36}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <User className="w-4 h-4 text-muted-foreground" />
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            href={`/profile/${user._id}`}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {user.name}
          </Link>
          <span className="text-sm text-muted-foreground">{action}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-xs text-muted-foreground/60">{timeAgo}</span>
        </div>
      </div>
      {isNew && (
        <span className="flex-shrink-0 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          Новое
        </span>
      )}
    </div>
  );
}

function PlantFeedCard({ item, isNew, language }: { item: FeedPlantItem; isNew: boolean; language: string }) {
  const photoUrl = getFeedPlantPhotoUrl(item.plant.photo);
  const plantName = getPlantName(item.plant.genusId, item.plant.varietyId, language);

  return (
    <div className={`relative bg-card border rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md ${isNew ? 'border-primary/40' : 'border-border'}`}>
      <UserRow
        user={item.user}
        action="добавил(а) растение"
        timeAgo={formatTimeAgo(item.createdAt)}
        isNew={isNew}
      />

      <Link href={`/profile/${item.user._id}/plants/${item.plant._id}`} className="block">
        {/* Photo */}
        <div className="mx-4 mb-3 aspect-[4/3] rounded-lg overflow-hidden bg-muted/30">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={plantName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Plant name */}
        <div className="px-4 pb-4">
          <p className="font-semibold text-foreground">{plantName}</p>
          {item.plant.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {item.plant.description}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

function HistoryFeedCard({ item, isNew, language }: { item: FeedHistoryItem; isNew: boolean; language: string }) {
  const plantName = getPlantName(item.plantMeta.genusId, item.plantMeta.varietyId, language);
  const photos = item.historyEntry.photos;

  const date = new Date(item.historyEntry.date);
  const formattedDate = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

  return (
    <div className={`relative bg-card border rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md ${isNew ? 'border-primary/40' : 'border-border'}`}>
      <UserRow
        user={item.user}
        action="добавил(а) запись"
        timeAgo={formatTimeAgo(item.createdAt)}
        isNew={isNew}
      />

      <div className="px-4 pb-4 space-y-3">
        {/* Link to plant */}
        <Link
          href={`/profile/${item.user._id}/plants/${item.plantMeta._id}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{plantName}</span>
          <span className="text-muted-foreground">· {formattedDate}</span>
        </Link>

        {/* Comment */}
        {item.historyEntry.comment && (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed line-clamp-4">
            {item.historyEntry.comment}
          </p>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {photos.slice(0, 6).map((photo, index) => (
              <div
                key={photo}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={getFeedHistoryPhotoUrl(photo)}
                  alt={`Фото ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 5 && photos.length > 6 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">+{photos.length - 6}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FeedCardProps {
  item: FeedItem;
  isNew: boolean;
  language: string;
}

export function FeedCard({ item, isNew, language }: FeedCardProps) {
  if (item.type === 'plant') {
    return <PlantFeedCard item={item} isNew={isNew} language={language} />;
  }
  return <HistoryFeedCard item={item} isNew={isNew} language={language} />;
}
