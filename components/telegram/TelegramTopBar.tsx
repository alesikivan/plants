'use client';

import { useTranslations } from 'next-intl';
import { Send, ArrowRight } from 'lucide-react';
import { TELEGRAM_COMMUNITY_URL, isTelegramCommunityEnabled } from '@/lib/config/telegram';
import { trackEvent } from '@/lib/analytics';

/** Thin promo strip above the header with a link to the Telegram community */
export function TelegramTopBar() {
  const t = useTranslations('TelegramTopBar');
  if (!isTelegramCommunityEnabled()) return null;

  return (
    <a
      href={TELEGRAM_COMMUNITY_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('telegram_topbar_click')}
      className="group flex w-full items-center justify-center gap-2 bg-primary px-4 py-1.5 text-xs sm:text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <Send className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate font-medium">{t('text')}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}
