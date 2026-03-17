'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { genusApi, Genus } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { getFullDisplayName } from '@/lib/utils/language';
import { trackEvent } from '@/lib/analytics';

interface CreateGenusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  onCreated: (genus: Genus) => void;
}

type Step = 'input' | 'confirm' | 'duplicate';

interface Suggestion {
  recognized: boolean;
  nameRu: string;
  nameEn: string;
}

export function CreateGenusModal({ open, onOpenChange, initialQuery = '', onCreated }: CreateGenusModalProps) {
  const t = useTranslations('CreateGenusModal');
  const locale = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [step, setStep] = useState<Step>('input');
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [existingGenus, setExistingGenus] = useState<Genus | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setStep('input');
      setSuggestion(null);
      setExistingGenus(null);
    }
  }, [open, initialQuery]);

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
  };

  const handleValidate = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    trackEvent('plant_genus_ai_recognize_clicked', { query: trimmed });
    setIsValidating(true);
    try {
      const result = await genusApi.validate(trimmed);
      setSuggestion(result.suggestion);

      if (result.suggestion.recognized) {
        trackEvent('plant_genus_ai_recognized', { query: trimmed, nameRu: result.suggestion.nameRu, nameEn: result.suggestion.nameEn });
        const [ruResults, enResults] = await Promise.all([
          genusApi.getAll(result.suggestion.nameRu),
          genusApi.getAll(result.suggestion.nameEn),
        ]);
        const existing = [...ruResults, ...enResults].find(
          (g) => g.nameRu === result.suggestion.nameRu || g.nameEn === result.suggestion.nameEn,
        );
        if (existing) {
          setExistingGenus(existing);
          setStep('duplicate');
          return;
        }
      }

      setStep('confirm');
      if (!result.suggestion.recognized) {
        trackEvent('plant_genus_ai_not_recognized', { query: trimmed });
      }
    } catch (error) {
      toast.error(t('toasts.validationError'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!suggestion) return;

    setIsSaving(true);
    const displayName = locale === 'ru' ? suggestion.nameRu : suggestion.nameEn;
    try {
      const genus = await genusApi.create({
        nameRu: suggestion.nameRu,
        nameEn: suggestion.nameEn,
      });
      trackEvent('plant_genus_created', { nameRu: suggestion.nameRu, nameEn: suggestion.nameEn });
      toast.success(t('toasts.createSuccess', { name: displayName }));
      onCreated(genus);
      handleOpenChange(false);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error(t('toasts.duplicateError'));
      } else {
        toast.error(t('toasts.createError'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseExisting = () => {
    if (existingGenus) {
      trackEvent('plant_genus_duplicate_used', { nameRu: existingGenus.nameRu, nameEn: existingGenus.nameEn });
      onCreated(existingGenus);
      handleOpenChange(false);
    }
  };

  const handleRetry = () => {
    setStep('input');
    setSuggestion(null);
    setExistingGenus(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <>
            <div className="grid gap-3 py-4">
              <Label htmlFor="genus-query">{t('label')}</Label>
              <Input
                id="genus-query"
                placeholder={t('placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('buttons.cancel')}
              </Button>
              <Button onClick={handleValidate} disabled={!query.trim() || isValidating}>
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.verifying')}
                  </>
                ) : (
                  t('buttons.verify')
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && suggestion && !suggestion.recognized && (
          <>
            <div className="py-4 space-y-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">{t('alerts.notRecognized.title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('alerts.notRecognized.description', { query })}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('buttons.cancel')}
              </Button>
              <Button onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('buttons.retry')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'duplicate' && existingGenus && (
          <>
            <div className="py-4 space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">{t('alerts.duplicate.title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('alerts.duplicate.description')}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">
                    {getFullDisplayName(existingGenus, locale)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('buttons.retryInput')}
              </Button>
              <Button onClick={handleUseExisting}>
                {t('buttons.useExisting')}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && suggestion && suggestion.recognized && (
          <>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">{t('aiSuggestion')}</p>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">
                    {getFullDisplayName({ nameRu: suggestion.nameRu, nameEn: suggestion.nameEn } as any, locale)}
                  </span>
                </div>
              </div>
              <p className="text-sm">{t('confirmText')}</p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleRetry} disabled={isSaving}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('buttons.retryInput')}
              </Button>
              <Button onClick={handleConfirm} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.saving')}
                  </>
                ) : (
                  t('buttons.create')
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
