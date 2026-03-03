'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
            format(date, 'dd MMMM yyyy', { locale: ru })
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
          locale={ru}
          weekStartsOn={1}
          disabled={disabledMatcher}
          formatters={{
            formatWeekdayName: (date) => {
              const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
              return days[date.getDay()];
            },
            formatMonthDropdown: (date) => {
              return date.toLocaleDateString('ru-RU', { month: 'long' });
            },
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
