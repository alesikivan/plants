'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api/client';
import { AuthPageHeader } from '@/components/auth/AuthPageHeader';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import type { AppLocale } from '@/i18n/routing';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const locale = useLocale() as AppLocale;
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    apiClient.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <AuthPageHeader locale={locale} backHref="/login" backLabel="Назад к входу" />
        <Card className="backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-6">
            <div className="flex justify-center">
              {status === 'loading' && (
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
              )}
            </div>

            <div>
              {status === 'loading' && (
                <>
                  <CardTitle>Подтверждение email...</CardTitle>
                  <CardDescription className="pt-2">Пожалуйста, подождите</CardDescription>
                </>
              )}
              {status === 'success' && (
                <>
                  <CardTitle>Email подтверждён!</CardTitle>
                  <CardDescription className="pt-2">
                    Спасибо за подтверждение. Ваш аккаунт активирован — теперь вы можете войти.
                  </CardDescription>
                </>
              )}
              {status === 'error' && (
                <>
                  <CardTitle>Ссылка недействительна</CardTitle>
                  <CardDescription className="pt-2">
                    Ссылка устарела или уже использована. Войдите и запросите новое письмо.
                  </CardDescription>
                </>
              )}
            </div>
          </CardHeader>

          {status !== 'loading' && (
            <CardFooter>
              <Button asChild className="w-full" size="lg">
                <Link href="/login">
                  Перейти к входу
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
