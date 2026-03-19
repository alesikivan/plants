'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { notificationsApi, NotificationItem as NotificationItemType } from '@/lib/api/notifications';
import { NotificationItem } from './NotificationItem';

export function NotificationBell() {
  const t = useTranslations('Notifications');
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click/touch (document-level, bypasses stacking context issues)
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    // Delay to avoid closing immediately on the same click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  // Poll unread count every 30 seconds
  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const { count } = await notificationsApi.getUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {}
    };

    fetchCount();
    const interval = setInterval(fetchCount, 12_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // When dropdown opens: load notifications + mark all read
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await notificationsApi.getAll();
        if (cancelled) return;
        setNotifications(data.items);
        setUnreadCount(0);
        notificationsApi.markAllRead().catch(() => {});
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [open]);

  const handleClearAll = async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
    } catch {}
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative shrink-0 w-8 h-8"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
        <div className="fixed inset-x-0 top-16 z-50 flex flex-col max-h-[calc(100dvh-4rem)] md:absolute md:inset-x-auto md:top-full md:right-0 md:mt-2 md:w-[360px] md:max-h-[480px] md:rounded-md bg-popover border border-border/50 shadow-lg">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="font-semibold text-sm">{t('title')}</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('clearAll')}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-muted-foreground">{t('loading')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t('empty')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>

        {createPortal(
          <div
            onClick={() => setOpen(false)}
            className="notifications-bg fixed inset-x-0 top-16 z-49"
          />,
          document.body
        )}
        </>
      )}
    </div>
  );
}
