'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { User, Bookmark } from 'lucide-react';
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
import { trackEvent } from '@/lib/analytics';
import { PhotoGallery } from '@/components/plants/PhotoGallery';

function formatTimeAgo(dateStr: string, t: any): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return t('timeAgo.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('timeAgo.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('timeAgo.hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('timeAgo.days', { count: days });
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return t('timeAgo.weeks', { count: weeks });
  const months = Math.floor(days / 30);
  if (months < 12) return t('timeAgo.months', { count: months });
  return t('timeAgo.years', { count: Math.floor(months / 12) });
}

function getNames(genus: FeedGenus, variety: FeedVariety | undefined, language: string) {
  const genusName = language === 'ru' ? genus.nameRu : genus.nameEn;
  const varietyName = variety ? (language === 'ru' ? variety.nameRu : variety.nameEn) : null;
  return { genusName, varietyName };
}

function Avatar({
  user,
  isNew,
  size = 36,
}: {
  user: { _id: string; name: string; avatar?: string };
  isNew: boolean;
  size?: number;
}) {
  const avatarUrl = getFeedAvatarUrl(user.avatar);
  return (
    <Link
      href={`/profile/${user._id}`}
      onClick={(e) => e.stopPropagation()}
      className="flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-muted transition-opacity hover:opacity-80 border border-border"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={user.name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <User className="w-4 h-4 text-muted-foreground" />
      )}
    </Link>
  );
}

function BookmarkButton({
  isBookmarked,
  onToggle,
  t,
}: {
  isBookmarked: boolean;
  onToggle: () => void;
  t: any;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
      aria-label={isBookmarked ? t('bookmark.remove') : t('bookmark.add')}
    >
      {isBookmarked ? (
        <Bookmark className="w-4 h-4 fill-primary text-primary" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
    </button>
  );
}

function PlantFeedCard({
  item,
  isNew,
  language,
  t,
  onBookmarkToggle,
}: {
  item: FeedPlantItem;
  isNew: boolean;
  language: string;
  t: any;
  onBookmarkToggle?: () => void;
}) {
  const tCard = t as any;
  const photoUrl = getFeedPlantPhotoUrl(item.plant.photo);
  const { genusName, varietyName } = getNames(item.plant.genusId, item.plant.varietyId, language);
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <div className={`relative bg-card border border-border rounded-2xl overflow-hidden`}>
      {isNew && (
        <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-bl-xl z-10">
          {tCard('badges.new')}
        </span>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Avatar user={item.user} isNew={isNew} />
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${item.user._id}`}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {item.user.name}
          </Link>
          <p className="text-xs text-muted-foreground">{tCard('plantAction')}</p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {formatTimeAgo(item.createdAt, tCard)}
        </span>
        {!item.isOwnItem && onBookmarkToggle && (
          <BookmarkButton isBookmarked={item.isBookmarked} onToggle={onBookmarkToggle} t={tCard} />
        )}
      </div>

      {/* Plant name badge — navigates to plant page */}
      <div className="px-4 pb-2">
        <Link
          href={`/profile/${item.user._id}/plants/${item.plant._id}`}
          onClick={() => trackEvent('feed_card_clicked', { type: 'plant' })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          {genusName}{varietyName ? ` · ${varietyName}` : ''}
        </Link>
      </div>

      {/* Full-width image — opens gallery */}
      {photoUrl && (
        <button
          onClick={() => setGalleryOpen(true)}
          className="block w-full aspect-[4/3] overflow-hidden"
        >
          <img
            src={photoUrl}
            alt={genusName}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
          />
        </button>
      )}

      {/* Description */}
      {item.plant.description && (
        <p className="px-4 pt-3 pb-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {item.plant.description}
        </p>
      )}

      {galleryOpen && photoUrl && (
        <PhotoGallery
          photos={[photoUrl]}
          initialIndex={0}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}

function HistoryFeedCard({
  item,
  isNew,
  language,
  t,
  onBookmarkToggle,
}: {
  item: FeedHistoryItem;
  isNew: boolean;
  language: string;
  t: any;
  onBookmarkToggle?: () => void;
}) {
  const tCard = t as any;
  const { genusName, varietyName } = getNames(
    item.plantMeta.genusId,
    item.plantMeta.varietyId,
    language,
  );
  const photos = item.historyEntry.photos;
  const photoUrls = photos.map((p) => getFeedHistoryPhotoUrl(p)!);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const gridClass =
    photos.length === 1
      ? 'grid-cols-1'
      : photos.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-3';

  return (
    <div className={`relative bg-card border border-border rounded-2xl overflow-hidden`}>
      {isNew && (
        <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-bl-xl z-10">
          {tCard('badges.new')}
        </span>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Avatar user={item.user} isNew={isNew} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/profile/${item.user._id}`}
              className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {item.user.name}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">{tCard('historyAction')}</p>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {formatTimeAgo(item.createdAt, tCard)}
        </span>
        {!item.isOwnItem && onBookmarkToggle && (
          <BookmarkButton isBookmarked={item.isBookmarked} onToggle={onBookmarkToggle} t={tCard} />
        )}
      </div>

      {/* Plant badge — navigates to plant page */}
      <div className="px-4 pb-2">
        <Link
          href={`/profile/${item.user._id}/plants/${item.plantMeta._id}`}
          onClick={() => trackEvent('feed_card_clicked', { type: 'plant_history' })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <span>{genusName}{varietyName ? ` · ${varietyName}` : ''}</span>
        </Link>
      </div>

      {/* Comment */}
      {item.historyEntry.comment && (
        <p className="px-4 pb-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {item.historyEntry.comment}
        </p>
      )}

      {/* Photos — open gallery on click */}
      {photos.length > 0 && (
        <div className={`grid gap-0.5 ${gridClass}`}>
          {photos.slice(0, 3).map((photo, index) => (
            <button
              key={photo}
              onClick={() => setSelectedPhotoIndex(index)}
              className="relative aspect-square overflow-hidden bg-muted block"
            >
              <img
                src={getFeedHistoryPhotoUrl(photo)!}
                alt={tCard('photoAlt', { number: index + 1 })}
                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              />
              {index === 2 && photos.length > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">+{photos.length - 3}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Bottom padding when no comment and no photos */}
      {!item.historyEntry.comment && photos.length === 0 && <div className="pb-4" />}

      {selectedPhotoIndex !== null && (
        <PhotoGallery
          photos={photoUrls}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  );
}

interface FeedCardProps {
  item: FeedItem;
  isNew: boolean;
  language: string;
  onBookmarkToggle?: () => void;
}

export function FeedCard({ item, isNew, language, onBookmarkToggle }: FeedCardProps) {
  const t = useTranslations('FeedCard');

  if (item.type === 'plant') {
    return (
      <PlantFeedCard
        item={item}
        isNew={isNew}
        language={language}
        t={t}
        onBookmarkToggle={onBookmarkToggle}
      />
    );
  }
  return (
    <HistoryFeedCard
      item={item}
      isNew={isNew}
      language={language}
      t={t}
      onBookmarkToggle={onBookmarkToggle}
    />
  );
}
