'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store/authStore';
import { showErrorToast } from '@/lib/api/error-handler';
import { ErrorType } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import type { AppLocale } from '@/i18n/routing';
import { trackEvent } from '@/lib/analytics';

export default function RegisterPage() {
  const t = useTranslations('RegisterPage');
  const locale = useLocale() as AppLocale;
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showErrorToast({
        type: ErrorType.VALIDATION,
        message: t('errors.passwordMismatch'),
      });
      return;
    }

    if (password.length < 6) {
      showErrorToast({
        type: ErrorType.VALIDATION,
        message: t('errors.passwordMinLength'),
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({ name, email, password, preferredLanguage: locale });
      if (result?.requiresVerification) {
        setSentEmail(email);
        setVerificationSent(true);
        trackEvent('user_registered', { locale });
      }
    } catch (err) {
      // Ошибки обрабатываются автоматически через axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <AuthPageHeader locale={locale} backHref="/" backLabel={t('backHome')} />

        <Card className="backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle>{t('verification.title')}</CardTitle>
                <CardDescription className="pt-2">
                  {t.rich('verification.description', {
                    email: () => <span className="font-medium text-foreground">{sentEmail}</span>,
                  })}
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                {t('verification.hint')}{' '}
                <Link href="/login" className="text-primary hover:underline">
                  {t('verification.loginLink')}
                </Link>
                {t('verification.loginSuffix')}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <AuthPageHeader locale={locale} backHref="/" backLabel={t('backHome')} />

        <Card className="backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Image src="/logo.svg" alt="PlantSheep" width={32} height={32} />
              </div>
            </div>

            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription className="pt-2">
                {t('description')}
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">{t('fields.name.label')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('fields.name.placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
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
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">{t('fields.password.label')}</Label>
                <PasswordInput
                  id="password"
                  placeholder={t('fields.password.placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">{t('fields.confirmPassword.label')}</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder={t('fields.confirmPassword.placeholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? t('submit.loading') : t('submit.default')}
              </Button>

              <div className="text-sm text-center text-muted-foreground">
                {t('loginPrompt')}{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  {t('loginLink')}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
