'use client';

import { useState, useEffect } from 'react';
import { Send, MessageCircle, Leaf, BookOpen, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MultiFileInput } from '@/components/ui/multi-file-input';
import { adminApi, TelegramCommunityTopic } from '@/lib/api/admin';
import { TELEGRAM_COMMUNITY_URL } from '@/lib/config/telegram';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MAX_PHOTOS = 10;

const TOPICS: { id: TelegramCommunityTopic; label: string; hint: string; icon: typeof Leaf }[] = [
  { id: 'general', label: 'Общение', hint: 'General — основной чат', icon: MessageCircle },
  { id: 'plants', label: 'Растения', hint: 'Тема с постами растений', icon: Leaf },
  { id: 'history', label: 'Истории', hint: 'Тема с записями истории', icon: BookOpen },
];

/**
 * Admin form: send a plain-text message (+ up to 10 photos) from the bot into the Telegram community.
 * Text formatting is not supported (escaped on the backend).
 */
export function TelegramBroadcastForm() {
  const [text, setText] = useState('');
  const [topics, setTopics] = useState<TelegramCommunityTopic[]>(['general']);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotosChange = (files: File[]) => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTopic = (id: TelegramCommunityTopic) => {
    setTopics((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleSend = async () => {
    if (!text.trim() && photos.length === 0) {
      toast.error('Введите текст или добавьте фото');
      return;
    }
    if (topics.length === 0) {
      toast.error('Выберите хотя бы одну тему');
      return;
    }

    setSending(true);
    setSentCount(null);
    try {
      const { sent } = await adminApi.telegramBroadcast(text.trim(), topics, photos);
      setSentCount(sent);
      setText('');
      handlePhotosChange([]);
      toast.success(sent > 0 ? `Отправлено в Telegram (тем: ${sent})` : 'Ничего не отправлено — проверьте настройки Telegram');
    } catch (error) {
      console.error('Telegram broadcast failed:', error);
      toast.error('Ошибка при отправке в Telegram');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-5">
      {/* Message */}
      <div className="space-y-1.5">
        <Label htmlFor="tg-text">Сообщение</Label>
        <Textarea
          id="tg-text"
          placeholder="Текст сообщения от имени бота..."
          rows={5}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Без форматирования. С фото подпись ограничена 1024 символами. {text.length}/4000
        </p>
      </div>

      {/* Photos */}
      <div className="space-y-1.5">
        <Label htmlFor="tg-photos">Фото (до {MAX_PHOTOS}, одним альбомом)</Label>
        <MultiFileInput
          id="tg-photos"
          accept="image/*"
          onFilesChange={handlePhotosChange}
          previews={previews}
          onRemove={handleRemovePhoto}
          maxSize={5 * 1024 * 1024}
          acceptedFormats={['JPG', 'PNG', 'GIF', 'WebP', 'HEIC']}
          maxFiles={MAX_PHOTOS}
          disableDateDetection
        />
      </div>

      {/* Topics */}
      <div className="space-y-3">
        <Label>Куда отправить</Label>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(({ id, label, hint, icon: Icon }) => {
            const active = topics.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleTopic(id)}
                title={hint}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Можно выбрать несколько тем — сообщение уйдёт в каждую.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3 text-sm">
          {sentCount !== null && sentCount > 0 && (
            <span className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              Отправлено (тем: {sentCount})
            </span>
          )}
          {TELEGRAM_COMMUNITY_URL && (
            <a
              href={TELEGRAM_COMMUNITY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Открыть группу <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <Button onClick={handleSend} disabled={sending} className="gap-2">
          <Send className="w-4 h-4" />
          {sending ? 'Отправка...' : 'Отправить в Telegram'}
        </Button>
      </div>
    </div>
  );
}
