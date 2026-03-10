'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const options: Array<{ label: string; shortLabel: string; locale: AppLocale }> = [
  { label: 'English', shortLabel: 'EN', locale: 'en' },
  { label: 'Русский', shortLabel: 'RU', locale: 'ru' },
];

interface LanguageSwitcherProps {
  locale: AppLocale;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      document.body.setAttribute('data-locale-select-open', 'true');
      return () => {
        document.body.removeAttribute('data-locale-select-open');
      };
    }

    document.body.removeAttribute('data-locale-select-open');
  }, [open]);

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={locale}
      disabled={isPending}
      onValueChange={(nextLocale) => {
        startTransition(() => {
          router.replace(pathname, { locale: nextLocale as AppLocale });
        });
      }}
    >
      <SelectTrigger className="h-9 w-[64px] rounded-full border-border bg-background text-xs font-semibold">
        <SelectValue>{options.find((option) => option.locale === locale)?.shortLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option.locale} value={option.locale} className="text-xs font-semibold">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
