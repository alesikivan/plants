import { Genus, Variety } from '@/lib/api';

export const getDisplayName = (
  item: Genus | Variety | null,
  language: string = 'ru'
): string => {
  if (!item) return '';

  if (language === 'en') {
    return item.nameEn;
  }

  return item.nameRu;
};

export const getFullDisplayName = (
  item: Genus | Variety | null,
  language: string = 'ru'
): string => {
  if (!item) return '';

  if (language === 'en') {
    return item.nameEn;
  }

  return `${item.nameRu} / ${item.nameEn}`;
};
