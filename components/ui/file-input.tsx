'use client';

import * as React from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/utils/image-compression';
import { getPhotoDate } from '@/lib/utils/exif';
import { isHeic, convertHeicToJpeg } from '@/lib/utils/heic';

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onFileChange?: (file: File | null) => void;
  onDateFound?: (date: Date | null) => void;
  preview?: string | null;
  onRemove?: () => void;
  maxSize?: number;
  acceptedFormats?: string[];
  disableDateDetection?: boolean;
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onFileChange, onDateFound, preview, onRemove, maxSize, acceptedFormats, disableDateDetection, accept, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (file) {
        // Extract EXIF date from original file before any conversion (only if not disabled)
        if (!disableDateDetection) {
          const date = await getPhotoDate(file);
          onDateFound?.(date);
        }

        const converted = isHeic(file) ? await convertHeicToJpeg(file) : file;
        const compressed = await compressImage(converted);
        onFileChange?.(compressed);
      } else {
        onFileChange?.(null);
      }
    };

    const formatFileSize = (bytes: number) => {
      return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
    };

    return (
      <div className="w-full">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          {...props}
        />

        {preview ? (
          <div className="relative rounded-xl border-2 border-input overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-background/90"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
              Удалить
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              "flex h-11 w-full items-center rounded-xl border-2 border-input bg-background px-4 py-3 text-base transition-all duration-200 hover:border-ring hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <Upload className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Выберите файл</span>
          </button>
        )}

        {maxSize && acceptedFormats && !preview && (
          <p className="mt-2 text-xs text-muted-foreground">
            Максимальный размер: {formatFileSize(maxSize)}. Форматы: {acceptedFormats.join(', ')}
          </p>
        )}
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';
