'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { AppLocale } from '@/i18n/routing';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const locale = useLocale() as AppLocale;
  const t = useTranslations('ResetPasswordPage');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('no-token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password.length < 6) {
      setValidationError(t('validationErrors.passwordMinLength'));
      return;
    }
    if (password !== confirmPassword) {
      setValidationError(t('validationErrors.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token!, password);
      setSuccess(true);
    } catch {
      setError('invalid-token');
    } finally {
      setIsLoading(false);
    }
  };

  if (error === 'no-token' || error === 'invalid-token') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
        <div className="w-full max-w-md space-y-8">
          <AuthPageHeader locale={locale} backHref="/login" backLabel={t('backLogin')} />
          <Card className="backdrop-blur-xl">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <div>
                <CardTitle>{t('titleInvalidLink')}</CardTitle>
                <CardDescription className="pt-2">
                  {t('descriptionInvalidLink')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter>
              <Link href="/forgot-password" className="w-full">
                <Button className="w-full" size="lg">
                  {t('requestNewLink')}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
        <div className="w-full max-w-md space-y-8">
          <Card className="backdrop-blur-xl">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle>{t('titleSuccess')}</CardTitle>
                <CardDescription className="pt-2">
                  {t('descriptionSuccess')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button className="w-full" size="lg">
                  {t('signIn')}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <AuthPageHeader locale={locale} backHref="/login" backLabel={t('backLogin')} />

        <Card className="backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Image src="/logo.svg" alt="PlantSheep" width={32} height={32} />
              </div>
            </div>
            <div>
              <CardTitle>{t('titleForm')}</CardTitle>
              <CardDescription className="pt-2">{t('descriptionForm')}</CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {validationError && (
                <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">{t('fields.password.label')}</Label>
                <PasswordInput
                  id="password"
                  placeholder={t('fields.password.placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
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
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
