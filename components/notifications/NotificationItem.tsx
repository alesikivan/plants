'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { User, ChevronRight, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/api/users';
import type { NotificationItem as NotificationItemType } from '@/lib/api/notifications';

interface Props {
  notification: NotificationItemType;
  onClose: () => void;
}

export function NotificationItem({ notification, onClose }: Props) {
  const t = useTranslations('Notifications');
  const locale = useLocale();
  const dateLocale = locale === 'ru' ? ru : enUS;

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: dateLocale,
  });

  const baseClass = cn(
    'relative flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0 group',
    !notification.isRead && 'bg-primary/5',
  );

  const unreadDot = !notification.isRead && (
    <div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-rose-500" />
  );

  // System notification — no actor, no navigation
  if (notification.type === 'system') {
    return (
      <div className={baseClass}>
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 self-start mt-0.5">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {notification.data.title && (
            <p className="text-sm font-semibold text-foreground leading-snug">
              {notification.data.title}
            </p>
          )}
          {notification.data.message && (
            <p className="text-sm text-muted-foreground leading-snug mt-0.5">
              {notification.data.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-0.5">{timeAgo}</p>
        </div>
        {unreadDot}
      </div>
    );
  }

  // User-triggered notifications
  const href =
    notification.type === 'new_follower'
      ? `/profile/${notification.actor?.id}`
      : `/plants/${notification.data.plantId}`;

  const actionKey = notification.type as
    | 'new_follower'
    | 'new_bookmark_plant'
    | 'new_bookmark_history';

  return (
    <Link href={href} onClick={onClose} className={baseClass}>
      <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center shrink-0 self-start mt-0.5">
        {notification.actor?.avatar ? (
          <Image
            src={getAvatarUrl(notification.actor.avatar)!}
            alt={notification.actor.name}
            width={36}
            height={36}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <User className="w-4 h-4 text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground leading-snug">
          <span className="font-semibold text-foreground">{notification.actor?.name}</span>
          {' '}
          {t(`actions.${actionKey}`)}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">{timeAgo}</p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors" />
      {unreadDot}
    </Link>
  );
}
