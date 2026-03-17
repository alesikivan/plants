'use client';

import { useState } from 'react';
import Image from 'next/image';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';
import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale } from '@/i18n/routing';
import { trackEvent } from '@/lib/analytics';

export default function ForgotPasswordPage() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('ForgotPasswordPage');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
    } catch {
      // Silently ignore — always show "check email" to prevent enumeration
    } finally {
      setIsLoading(false);
      setSent(true);
      trackEvent('password_reset_requested');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <AuthPageHeader locale={locale} backHref="/login" backLabel={t('backLogin')} />

        <Card className="backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                {sent ? <MailCheck className="w-8 h-8 text-primary" /> : <Image src="/logo.svg" alt="PlantSheep" width={32} height={32} />}
              </div>
            </div>
            <div>
              <CardTitle>{sent ? t('titleSent') : t('titleInitial')}</CardTitle>
              <CardDescription className="pt-2">
                {sent ? t('descriptionSent') : t('descriptionInitial')}
              </CardDescription>
            </div>
          </CardHeader>

          {!sent ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-3">
                <Label htmlFor="email">{t('fields.email.label')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('fields.email.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? t('submit.loading') : t('submit.default')}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardFooter className="pt-0">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full" size="lg">
                  {t('backToLogin')}
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
