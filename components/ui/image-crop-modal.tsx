'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getCroppedImg } from '@/lib/utils/image-crop';

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  /** Replaces "Отмена" label — e.g. "Пропустить" for queue mode */
  cancelLabel?: string;
  /** Show "1 из 3" progress in the title */
  queueInfo?: { current: number; total: number };
}

export function ImageCropModal({
  open,
  imageSrc,
  onCropComplete,
  onCancel,
  cancelLabel,
  queueInfo,
}: ImageCropModalProps) {
  const t = useTranslations('ImageCropModal');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspect, setAspect] = useState<number>(1);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedFile);
    } finally {
      setIsProcessing(false);
    }
  };

  const title = queueInfo
    ? t('titleQueue', { current: queueInfo.current, total: queueInfo.total })
    : t('title');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Crop area — edge-to-edge */}
        <div className="relative w-full bg-black" style={{ aspectRatio: aspect === 1 ? '1' : '5/7', maxHeight: '60svh' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
            }}
          />
        </div>

        {/* Zoom control */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAspect(aspect === 1 ? 5 / 7 : 1)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label={t('toggleFormat')}
            >
              {aspect === 1 ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label={t('zoomOut')}
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <div className="relative flex-1 flex items-center">
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${((zoom - 1) / 2) * 100}%` }}
                  />
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="relative w-full appearance-none bg-transparent cursor-pointer h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:border-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label={t('zoomIn')}
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">
              {zoom.toFixed(1)}×
            </span>
          </div>
        </div>

        <DialogFooter className="px-5 pb-5 pt-2 gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing} className="flex-1">
            {cancelLabel ?? t('cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isProcessing || !croppedAreaPixels} className="flex-1">
            {isProcessing ? t('processing') : t('apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
