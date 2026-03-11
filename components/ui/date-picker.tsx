'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledMatcher?: (date: Date) => boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Выберите дату',
  disabled = false,
  disabledMatcher,
}: DatePickerProps) {
  const locale = useLocale();

  const dateLocale = locale === 'ru' ? ru : enUS;
  const dateFormat = locale === 'ru' ? 'dd MMMM yyyy' : 'MMMM dd, yyyy';

  const ruWeekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const enWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, dateFormat, { locale: dateLocale })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          captionLayout="dropdown"
          locale={dateLocale}
          weekStartsOn={1}
          disabled={disabledMatcher}
          formatters={{
            formatWeekdayName: (date) => {
              const days = locale === 'ru' ? ruWeekDays : enWeekDays;
              return days[date.getDay()];
            },
            formatMonthDropdown: (date) => {
              return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'long' });
            },
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
