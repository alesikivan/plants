'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { followsApi } from '@/lib/api/follows';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onToggle?: (isFollowing: boolean) => void;
  className?: string;
}

export function FollowButton({ userId, isFollowing, onToggle, className }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await followsApi.unfollow(userId);
        setFollowing(false);
        onToggle?.(false);
      } else {
        await followsApi.follow(userId);
        setFollowing(true);
        onToggle?.(true);
      }
    } catch {
      toast.error('Ошибка. Попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
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
      {following ? 'Подписан(а)' : 'Подписаться'}
    </button>
  );
}
