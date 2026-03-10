'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';

const options: Array<{ label: string; shortLabel: string; locale: AppLocale }> = [
  { label: 'English', shortLabel: 'EN', locale: 'en' },
  { label: 'Русский', shortLabel: 'RU', locale: 'ru' },
];

interface AuthPageHeaderProps {
  locale: AppLocale;
  backHref: string;
  backLabel: string;
}

export function AuthPageHeader({ locale, backHref, backLabel }: AuthPageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const targetPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

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
    <div className="flex items-center justify-between gap-3">
      <Link
        href={backHref}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>

      <Select
        open={open}
        onOpenChange={setOpen}
        value={locale}
        disabled={isPending}
        onValueChange={(nextLocale) => {
          startTransition(() => {
            router.replace(targetPath, { locale: nextLocale as AppLocale });
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
    </div>
  );
}
