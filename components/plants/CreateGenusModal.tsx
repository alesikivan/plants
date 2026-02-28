'use client';

import { useState, useEffect } from 'react';
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

    setIsValidating(true);
    try {
      const result = await genusApi.validate(trimmed);
      setSuggestion(result.suggestion);

      if (result.suggestion.recognized) {
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
    } catch (error) {
      toast.error('Не удалось проверить название. Попробуйте ещё раз.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!suggestion) return;

    setIsSaving(true);
    try {
      const genus = await genusApi.create({
        nameRu: suggestion.nameRu,
        nameEn: suggestion.nameEn,
      });
      toast.success(`Род «${suggestion.nameRu}» успешно создан!`);
      onCreated(genus);
      handleOpenChange(false);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error('Такой род уже существует');
      } else {
        toast.error('Ошибка при создании рода');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseExisting = () => {
    if (existingGenus) {
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
          <DialogTitle>Создать новый род</DialogTitle>
          <DialogDescription>
            Введите название рода на русском или английском языке — мы проверим его через ИИ
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <>
            <div className="grid gap-3 py-4">
              <Label htmlFor="genus-query">Название рода</Label>
              <Input
                id="genus-query"
                placeholder="Например: Монстера или Monstera"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Отмена
              </Button>
              <Button onClick={handleValidate} disabled={!query.trim() || isValidating}>
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверяем...
                  </>
                ) : (
                  'Проверить'
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
                  <p className="text-sm font-medium text-destructive">Растение не найдено</p>
                  <p className="text-sm text-muted-foreground">
                    Не удалось распознать «{query}» как название рода растения. Уточните название — возможно, в нём опечатка или оно введено некорректно.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Отмена
              </Button>
              <Button onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Попробовать снова
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
                  <p className="text-sm font-medium text-amber-800">Род уже существует в базе</p>
                  <p className="text-sm text-muted-foreground">
                    Такой род уже есть. Хотите использовать существующий?
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">
                    {existingGenus.nameRu} / {existingGenus.nameEn}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Ввести заново
              </Button>
              <Button onClick={handleUseExisting}>
                Использовать этот род
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && suggestion && suggestion.recognized && (
          <>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">ИИ предлагает следующее название:</p>
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium">
                    {suggestion.nameRu} / {suggestion.nameEn}
                  </span>
                </div>
              </div>
              <p className="text-sm">Это именно тот род, который вы искали?</p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleRetry} disabled={isSaving}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Нет, ввести заново
              </Button>
              <Button onClick={handleConfirm} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Да, создать'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
