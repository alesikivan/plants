'use client';

import * as React from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MultiFileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onFilesChange?: (files: File[]) => void;
  previews?: string[];
  onRemove?: (index: number) => void;
  maxSize?: number;
  acceptedFormats?: string[];
  maxFiles?: number;
}

export const MultiFileInput = React.forwardRef<HTMLInputElement, MultiFileInputProps>(
  ({ className, onFilesChange, previews = [], onRemove, maxSize, acceptedFormats, maxFiles = 10, accept, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      onFilesChange?.(files);
    };

    const formatFileSize = (bytes: number) => {
      return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
    };

    return (
      <div className="w-full space-y-3">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleChange}
          {...props}
        />

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative rounded-xl border-2 border-input overflow-hidden group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemove?.(index)}
                  className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive hover:scale-110 active:scale-95 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "flex h-11 w-full items-center rounded-xl border-2 border-input bg-background px-4 py-3 text-base transition-all duration-200 hover:border-ring hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <Upload className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {previews.length > 0 ? `Выбрано фото: ${previews.length}` : 'Выберите фотографии'}
          </span>
        </button>

        {maxSize && acceptedFormats && (
          <p className="text-xs text-muted-foreground">
            Максимальный размер: {formatFileSize(maxSize)} на файл. Форматы: {acceptedFormats.join(', ')}. До {maxFiles} фото
          </p>
        )}
      </div>
    );
  }
);

MultiFileInput.displayName = 'MultiFileInput';
