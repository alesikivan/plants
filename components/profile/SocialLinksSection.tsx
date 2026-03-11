'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SocialLink } from '@/lib/types/user';
import { SocialLinkItem } from './SocialLinkItem';
import { AddSocialLinkDialog } from './AddSocialLinkDialog';
import { Loader2 } from 'lucide-react';

interface SocialLinksSectionProps {
  socialLinks: SocialLink[];
  onUpdate?: (socialLinks: SocialLink[]) => Promise<void>;
  isReadOnly?: boolean;
}

export function SocialLinksSection({
  socialLinks = [],
  onUpdate,
  isReadOnly = false,
}: SocialLinksSectionProps) {
  const t = useTranslations('SocialLinksSection');
  const [links, setLinks] = useState<SocialLink[]>(socialLinks);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddLink = async (newLink: SocialLink) => {
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
    await saveLinks(updatedLinks);
  };

  const handleUpdateLink = async (index: number, updatedLink: SocialLink) => {
    const updatedLinks = [...links];
    updatedLinks[index] = updatedLink;
    setLinks(updatedLinks);
    await saveLinks(updatedLinks);
  };

  const handleDeleteLink = async (index: number) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    await saveLinks(updatedLinks);
  };

  const saveLinks = async (updatedLinks: SocialLink[]) => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      const cleanLinks = updatedLinks.map(({ type, value, isPublic }) => ({ type, value, isPublic }));
      await onUpdate(cleanLinks as SocialLink[]);
    } finally {
      setIsSaving(false);
    }
  };

  const existingTypes = links.map((link) => link.type);

  if (isReadOnly && links.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {!isReadOnly && links.length < 4 && (
          <AddSocialLinkDialog
            existingTypes={existingTypes}
            onAdd={handleAddLink}
          />
        )}
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {t('saving')}
          </div>
        )}
      </div>

      {links.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
          {t('empty')}
        </p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {links.map((link, index) => (
            <SocialLinkItem
              key={`${link.type}-${index}`}
              link={link}
              onUpdate={(updatedLink) => handleUpdateLink(index, updatedLink)}
              onDelete={() => handleDeleteLink(index)}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}
