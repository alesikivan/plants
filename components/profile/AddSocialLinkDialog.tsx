'use client';

import { useState } from 'react';
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

const SOCIAL_TYPES = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'phone', label: 'Телефон' },
  { value: 'email', label: 'Почта' },
];

const SOCIAL_PLACEHOLDERS: Record<string, string> = {
  telegram: '@username или t.me/username',
  instagram: '@username',
  phone: '+7 999 123-45-67',
  email: 'example@mail.com',
};

interface AddSocialLinkDialogProps {
  existingTypes: string[];
  onAdd: (link: SocialLink) => void;
}

export function AddSocialLinkDialog({ existingTypes, onAdd }: AddSocialLinkDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<string>('');
  const [value, setValue] = useState('');

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
        Добавить
      </Button>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Добавить способ связи</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div>
            <Label htmlFor="type-select" className="text-sm mb-2 block">
              Тип
            </Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type-select" className="h-10">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type && (
            <div>
              <Label htmlFor="value-input" className="text-sm mb-2 block">
                Значение
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
            Отмена
          </Button>
          <Button onClick={handleAdd} disabled={!type || !value.trim()}>
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
