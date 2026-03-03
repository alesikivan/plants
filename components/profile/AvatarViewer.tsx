'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AvatarViewerProps {
  avatarUrl: string;
  userName: string;
  onClose: () => void;
}

export function AvatarViewer({ avatarUrl, userName, onClose }: AvatarViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-black/95 border-none">
        <div className="relative w-full h-[60vh] flex items-center justify-center">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <img
            src={avatarUrl}
            alt={userName}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
