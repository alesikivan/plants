'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';
import { trackEvent } from '@/lib/analytics';

interface EditNameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
}

export function EditNameModal({ open, onOpenChange, currentName }: EditNameModalProps) {
  const t = useTranslations('ProfilePage');
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNameInput(currentName);
      setNameError('');
    }
  }, [open, currentName]);

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (trimmed.length < 5) { setNameError(t('name.minLength')); return; }
    if (trimmed.length > 17) { setNameError(t('name.maxLength')); return; }
    setIsSaving(true);
    setNameError('');
    try {
      await updateProfile({ name: trimmed });
      trackEvent('profile_name_changed');
      toast.success(t('name.successToast'));
      onOpenChange(false);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409) {
        setNameError(t('name.errorTaken'));
      } else {
        toast.error(t('name.errorToast'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('name.modalTitle')}</DialogTitle>
          <DialogDescription>{t('name.modalDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="name-input">{t('name.label')}</Label>
          <Input
            id="name-input"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder={t('name.placeholder')}
            maxLength={17}
            disabled={isSaving}
            autoFocus
          />
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          <p className="text-xs text-muted-foreground">{t('name.hint')}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('name.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t('name.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
