'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ImageCropModal } from '@/components/ui/image-crop-modal';
import { compressImage } from '@/lib/utils/image-compression';
import { getPhotoDate } from '@/lib/utils/exif';
import { isHeic, convertHeicToJpeg } from '@/lib/utils/heic';

interface MultiFileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onFilesChange?: (files: File[]) => void;
  onDateFound?: (date: Date | null) => void;
  previews?: string[];
  onRemove?: (index: number) => void;
  maxSize?: number;
  acceptedFormats?: string[];
  maxFiles?: number;
  disableDateDetection?: boolean;
}

interface CropQueueItem {
  /** HEIC-converted but not yet cropped */
  file: File;
  dataUrl: string;
}

export const MultiFileInput = React.forwardRef<HTMLInputElement, MultiFileInputProps>(
  ({ className, onFilesChange, onDateFound, previews = [], onRemove, maxSize, acceptedFormats, maxFiles = 10, disableDateDetection, accept, ...props }, ref) => {
    const t = useTranslations('MultiFileInput');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [cropQueue, setCropQueue] = React.useState<CropQueueItem[]>([]);
    // Files that have been processed (cropped or skipped) but not yet compressed+submitted
    const pendingRef = React.useRef<File[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    // Key to force-remount the input element (Android fix)
    const [inputKey, setInputKey] = React.useState(0);
    const visibilityListenerRef = React.useRef<(() => void) | null>(null);
    // Track if onChange fired so we don't remount input prematurely (Android cloud file race)
    const onChangeFiredRef = React.useRef(false);

    React.useEffect(() => {
      return () => {
        if (visibilityListenerRef.current) {
          document.removeEventListener('visibilitychange', visibilityListenerRef.current);
        }
      };
    }, []);

    const handleClick = () => {
      // On Android the file picker launches a separate activity — the page becomes hidden,
      // then visible again when the picker closes. We use visibilitychange (not window.focus,
      // which fires erratically on desktop) to detect this and remount the <input> so the
      // next tap always works with a fresh element.
      onChangeFiredRef.current = false;
      if (visibilityListenerRef.current) {
        document.removeEventListener('visibilitychange', visibilityListenerRef.current);
      }
      const onVisibilityChange = () => {
        if (!document.hidden) {
          // Page became visible: picker closed. Wait long enough for onChange to fire first.
          // On Android, onChange can be delayed (especially for cloud files from Google Photos).
          // Only remount the input if onChange hasn't fired — i.e. user cancelled the picker.
          setTimeout(() => {
            if (!onChangeFiredRef.current) {
              setInputKey((k) => k + 1);
            }
          }, 800);
          document.removeEventListener('visibilitychange', onVisibilityChange);
          visibilityListenerRef.current = null;
        }
      };
      visibilityListenerRef.current = onVisibilityChange;
      document.addEventListener('visibilitychange', onVisibilityChange);

      inputRef.current?.click();
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      onChangeFiredRef.current = true;
      let files = e.target.files ? Array.from(e.target.files) : [];
      e.target.value = '';

      if (files.length === 0) return;

      const remaining = maxFiles - previews.length;
      if (files.length > remaining) {
        toast.error(t('limitExceeded', { maxFiles }));
        files = files.slice(0, remaining);
        if (files.length === 0) return;
      }

      setIsLoading(true);
      try {
        if (!disableDateDetection) {
          const date = await getPhotoDate(files[0]);
          onDateFound?.(date);
        }

        const converted = await Promise.all(
          files.map((f) => isHeic(f) ? convertHeicToJpeg(f) : f)
        );

        // Build queue with data URLs for the crop modal
        const queue: CropQueueItem[] = await Promise.all(
          converted.map((file) => new Promise<CropQueueItem>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ file, dataUrl: reader.result as string });
            reader.onerror = () => reject(new Error(`FileReader error: ${reader.error?.message ?? 'unknown'}`));
            reader.readAsDataURL(file);
          }))
        );

        pendingRef.current = [];
        setCropQueue(queue);
      } finally {
        setIsLoading(false);
      }
    };

    const finishQueue = async (accumulated: File[]) => {
      pendingRef.current = [];
      setCropQueue([]);
      const compressed = await Promise.all(accumulated.map((f) => compressImage(f)));
      onFilesChange?.(compressed);
    };

    const handleCropComplete = async (croppedFile: File) => {
      const accumulated = [...pendingRef.current, croppedFile];
      const remaining = cropQueue.slice(1);

      if (remaining.length === 0) {
        await finishQueue(accumulated);
      } else {
        pendingRef.current = accumulated;
        setCropQueue(remaining);
      }
    };

    const handleSkip = async () => {
      const accumulated = [...pendingRef.current, cropQueue[0].file];
      const remaining = cropQueue.slice(1);

      if (remaining.length === 0) {
        await finishQueue(accumulated);
      } else {
        pendingRef.current = accumulated;
        setCropQueue(remaining);
      }
    };

    const formatFileSize = (bytes: number) => {
      return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
    };

    const totalInQueue = pendingRef.current.length + cropQueue.length;
    const currentInQueue = pendingRef.current.length + 1;

    return (
      <div className="w-full space-y-3">
        <input
          key={inputKey}
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleChange}
          {...props}
        />

        {cropQueue.length > 0 && (
          <ImageCropModal
            key={cropQueue[0].dataUrl}
            open={true}
            imageSrc={cropQueue[0].dataUrl}
            onCropComplete={handleCropComplete}
            onCancel={handleSkip}
            cancelLabel={t('skipButton')}
            queueInfo={totalInQueue > 1 ? { current: currentInQueue, total: totalInQueue } : undefined}
          />
        )}

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

        {isLoading ? (
          <div className="flex h-11 w-full items-center rounded-xl border-2 border-input bg-background px-4 py-3 text-base justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">{t('processing')}</span>
          </div>
        ) : previews.length < maxFiles ? (
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
              {previews.length > 0 ? t('addMore') : t('selectButton')}
            </span>
          </button>
        ) : null}

        {maxSize && acceptedFormats && (
          <p className="text-xs text-muted-foreground">
            {t('helperText', {
              size: formatFileSize(maxSize),
              formats: acceptedFormats.join(', '),
              maxFiles: maxFiles
            })}
          </p>
        )}
      </div>
    );
  }
);

MultiFileInput.displayName = 'MultiFileInput';
