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
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit2, Mail, Phone, Send, Instagram, Check } from 'lucide-react';

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  telegram: <Send className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
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
  const t = useTranslations('SocialLinkItem');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValue, setEditValue] = useState(link.value);
  const [editIsPublic, setEditIsPublic] = useState(link.isPublic);
  const [isCopied, setIsCopied] = useState(false);

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

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(link.value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="text-gray-600 dark:text-gray-400 flex-shrink-0">
            {SOCIAL_ICONS[link.type]}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t(`types.${link.type}`) || link.type}
            </p>
            <button
              onClick={handleCopy}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-all text-left cursor-pointer"
            >
              {isCopied ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Check className="w-3.5 h-3.5" />
                  {t('copied')}
                </span>
              ) : (
                link.value
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status indicator circle */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              link.isPublic
                ? 'bg-green-500'
                : 'bg-yellow-500'
            }`}
          />

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
              {t('editTitle', { type: t(`types.${link.type}`) || link.type })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div>
              <Label htmlFor="edit-value" className="text-sm mb-2 block">
                {t('valueLabel')}
              </Label>
              <Input
                id="edit-value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={t(`placeholders.${link.type}`) || ''}
                className="h-10"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <Label htmlFor="edit-public" className="text-sm">
                {t('showInProfileLabel')}
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
              {t('cancelButton')}
            </Button>
            <Button onClick={handleSave}>{t('saveButton')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
