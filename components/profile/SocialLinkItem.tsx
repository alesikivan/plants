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
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit2 } from 'lucide-react';

const SOCIAL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
  phone: 'Телефон',
  email: 'Почта',
};

interface SocialLinkItemProps {
  link: SocialLink;
  onUpdate: (updatedLink: SocialLink) => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

export function SocialLinkItem({
  link,
  onUpdate,
  onDelete,
  isReadOnly = false,
}: SocialLinkItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValue, setEditValue] = useState(link.value);
  const [editIsPublic, setEditIsPublic] = useState(link.isPublic);

  const handleSave = () => {
    onUpdate({
      ...link,
      value: editValue,
      isPublic: editIsPublic,
    });
    setIsEditOpen(false);
  };

  const getLinkUrl = () => {
    if (link.type === 'telegram') {
      return `https://t.me/${link.value.replace('@', '')}`;
    }
    if (link.type === 'instagram') {
      return `https://instagram.com/${link.value.replace('@', '')}`;
    }
    if (link.type === 'email') {
      return `mailto:${link.value}`;
    }
    if (link.type === 'phone') {
      return `tel:${link.value}`;
    }
    return '#';
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-3 px-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {SOCIAL_LABELS[link.type] || link.type}
          </p>
          <a
            href={getLinkUrl()}
            target={link.type === 'email' || link.type === 'phone' ? undefined : '_blank'}
            rel={link.type !== 'email' && link.type !== 'phone' ? 'noopener noreferrer' : undefined}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all"
          >
            {link.value}
          </a>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status indicator circle */}
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                link.isPublic
                  ? 'bg-green-500'
                  : 'bg-yellow-500'
              }`}
            />
          </div>

          {!isReadOnly && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Редактировать {SOCIAL_LABELS[link.type] || link.type}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div>
              <Label htmlFor="edit-value" className="text-sm mb-2 block">
                Значение
              </Label>
              <Input
                id="edit-value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={
                  link.type === 'telegram'
                    ? '@username или t.me/username'
                    : link.type === 'instagram'
                      ? '@username'
                      : link.type === 'phone'
                        ? '+7 999 123-45-67'
                        : ''
                }
                className="h-10"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <Label htmlFor="edit-public" className="text-sm">
                Видимо в профиле
              </Label>
              <Switch
                id="edit-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
