'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Send, Leaf, BookOpen, ExternalLink, Loader2, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/lib/store/authStore';
import { plantsApi } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import {
  TELEGRAM_COMMUNITY_URL,
  TELEGRAM_COMMUNITY_LAUNCH_DATE,
  isTelegramCommunityEnabled,
} from '@/lib/config/telegram';

/**
 * One-time full-screen modal announcing the Telegram community.
 * - "new" variant for users registered after the feature launch,
 * - "existing" variant for users registered before.
 * Dismissal and auto-publish preferences are persisted on the user (server side),
 * so the modal is shown once across devices.
 */
export function TelegramCommunityBanner() {
  const t = useTranslations('TelegramBanner');
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [publishPlants, setPublishPlants] = useState(true);
  const [publishHistory, setPublishHistory] = useState(true);
  const [publishRecent, setPublishRecent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hiddenLocally, setHiddenLocally] = useState(false);

  const open =
    !!user && !user.telegramBannerDismissed && !hiddenLocally && isTelegramCommunityEnabled();

  if (!user) return null;

  const isNewUser = new Date(user.createdAt) >= TELEGRAM_COMMUNITY_LAUNCH_DATE;
  const variant = isNewUser ? 'new' : 'existing';

  const plantsPublic = user.showPlants ?? true;
  const historyPublic = plantsPublic && (user.showPlantHistory ?? true);

  const effectivePublishPlants = plantsPublic && publishPlants;
  const effectivePublishHistory = historyPublic && publishHistory;

  const handleJoin = () => {
    trackEvent('telegram_banner_join', { variant });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        telegramPublishPlants: effectivePublishPlants,
        telegramPublishHistory: effectivePublishHistory,
        telegramBannerDismissed: true,
      });
      trackEvent('telegram_banner_saved', {
        variant,
        publish_plants: effectivePublishPlants,
        publish_history: effectivePublishHistory,
        publish_recent: effectivePublishPlants && publishRecent,
      });
      toast.success(t('toasts.saved'));
      setHiddenLocally(true);

      if (effectivePublishPlants && publishRecent) {
        try {
          const { published } = await plantsApi.publishRecentToTelegram();
          if (published > 0) {
            toast.success(t('toasts.recentPublished', { count: published }));
          }
        } catch (error) {
          console.error('Failed to publish recent plants to Telegram:', error);
          toast.error(t('toasts.recentError'));
        }
      }
    } catch (error) {
      console.error('Failed to save Telegram banner settings:', error);
      toast.error(t('toasts.error'));
    } finally {
      setIsSaving(false);
    }
  };

  /** Close (X / overlay / Esc): hide only until the next page load — nothing is persisted */
  const handleClose = () => {
    if (isSaving) return;
    setHiddenLocally(true);
    trackEvent('telegram_banner_closed', { variant });
  };

  /** Explicit decline: persist "don't show again", auto-publish stays off */
  const handleDecline = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        telegramPublishPlants: false,
        telegramPublishHistory: false,
        telegramBannerDismissed: true,
      });
      trackEvent('telegram_banner_declined', { variant });
      setHiddenLocally(true);
    } catch (error) {
      console.error('Failed to decline Telegram banner:', error);
      toast.error(t('toasts.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Send className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle className="leading-tight">{t(`${variant}.title`)}</DialogTitle>
              <DialogDescription>{t(`${variant}.description`)}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-4">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a
              href={TELEGRAM_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleJoin}
            >
              <Send className="mr-2 h-4 w-4" />
              {t('join')}
              <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" />
            </a>
          </Button>
        </div>

        <div className="space-y-3 pt-4">
          <label
            htmlFor="tg-banner-plants"
            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${plantsPublic ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Leaf className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium leading-tight">{t('publishPlants')}</span>
                <span className="text-xs text-muted-foreground">
                  {plantsPublic ? t('publishPlantsHint') : t('requiresPublicPlants')}
                </span>
              </span>
            </span>
            <Switch
              id="tg-banner-plants"
              checked={effectivePublishPlants}
              onCheckedChange={setPublishPlants}
              disabled={!plantsPublic || isSaving}
            />
          </label>

          <label
            htmlFor="tg-banner-history"
            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${historyPublic ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium leading-tight">{t('publishHistory')}</span>
                <span className="text-xs text-muted-foreground">
                  {historyPublic ? t('publishHistoryHint') : t('requiresPublicHistory')}
                </span>
              </span>
            </span>
            <Switch
              id="tg-banner-history"
              checked={effectivePublishHistory}
              onCheckedChange={setPublishHistory}
              disabled={!historyPublic || isSaving}
            />
          </label>

          {effectivePublishPlants && (
            <label
              htmlFor="tg-banner-recent"
              className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-3 py-3 cursor-pointer"
            >
              <Checkbox
                id="tg-banner-recent"
                checked={publishRecent}
                onCheckedChange={(checked) => setPublishRecent(!!checked)}
                disabled={isSaving}
              />
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium leading-tight flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-primary" />
                  {t('publishRecent')}
                </span>
                <span className="text-xs text-muted-foreground">{t('publishRecentHint')}</span>
              </span>
            </label>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={handleDecline} disabled={isSaving}>
            {t('decline')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
