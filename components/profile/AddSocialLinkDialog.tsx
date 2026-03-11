'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SocialLink } from '@/lib/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface AddSocialLinkDialogProps {
  existingTypes: string[];
  onAdd: (link: SocialLink) => void;
}

export function AddSocialLinkDialog({ existingTypes, onAdd }: AddSocialLinkDialogProps) {
  const t = useTranslations('AddSocialLinkDialog');
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>('');
  const [value, setValue] = useState('');

  const SOCIAL_TYPES = [
    { value: 'telegram', label: t('types.telegram') },
    { value: 'instagram', label: t('types.instagram') },
    { value: 'phone', label: t('types.phone') },
    { value: 'email', label: t('types.email') },
  ];

  const SOCIAL_PLACEHOLDERS: Record<string, string> = {
    telegram: t('placeholders.telegram'),
    instagram: t('placeholders.instagram'),
    phone: t('placeholders.phone'),
    email: t('placeholders.email'),
  };

  const availableTypes = SOCIAL_TYPES.filter((t) => !existingTypes.includes(t.value));

  const handleAdd = () => {
    if (!type || !value.trim()) return;

    onAdd({
      type,
      value: value.trim(),
      isPublic: true,
    });

    setType('');
    setValue('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className="gap-2 h-9">
        <Plus className="w-4 h-4" />
        {t('addButton')}
      </Button>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div>
            <Label htmlFor="type-select" className="text-sm mb-2 block">
              {t('typeLabel')}
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type-select" className="h-10">
                <SelectValue placeholder={t('typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((typeOption) => (
                  <SelectItem key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type && (
            <div>
              <Label htmlFor="value-input" className="text-sm mb-2 block">
                {t('valueLabel')}
              </Label>
              <Input
                id="value-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={SOCIAL_PLACEHOLDERS[type]}
                className="h-10"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('cancelButton')}
          </Button>
          <Button onClick={handleAdd} disabled={!type || !value.trim()}>
            {t('addButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
