'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { followsApi } from '@/lib/api/follows';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onToggle?: (isFollowing: boolean) => void;
  className?: string;
}

export function FollowButton({ userId, isFollowing, onToggle, className }: FollowButtonProps) {
  const t = useTranslations('FollowButton');
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleClick = () => {
    if (following) {
      setConfirmOpen(true);
    } else {
      doFollow();
    }
  };

  const doFollow = async () => {
    setLoading(true);
    try {
      await followsApi.follow(userId);
      setFollowing(true);
      onToggle?.(true);
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const doUnfollow = async () => {
    setLoading(true);
    try {
      await followsApi.unfollow(userId);
      setFollowing(false);
      onToggle?.(false);
    } catch {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3.5 py-1.5 transition-all disabled:opacity-50',
          following
            ? 'bg-muted text-muted-foreground hover:bg-muted/70'
            : 'bg-primary text-primary-foreground hover:bg-primary/90',
          className,
        )}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {following ? t('following') : t('follow')}
      </button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('unfollowConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('unfollowConfirm.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('unfollowConfirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={doUnfollow}>
              {t('unfollowConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
