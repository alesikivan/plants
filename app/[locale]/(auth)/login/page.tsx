'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/authStore';
import { showSuccessToast, showInfoToast } from '@/lib/api/error-handler';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ShieldX, MailWarning } from 'lucide-react';
import { AxiosError } from 'axios';

const REASON_MESSAGES: Record<string, string> = {
  blocked: 'Ваш аккаунт был заблокирован администратором.',
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const reason = searchParams.get('reason');
  const verified = searchParams.get('verified');
  const reasonMessage = reason ? REASON_MESSAGES[reason] : null;

  useEffect(() => {
    if (verified === 'true') {
      showSuccessToast('Email подтверждён! Теперь вы можете войти.');
    } else if (verified === 'error') {
      showInfoToast('Ссылка недействительна или устарела. Запросите новое письмо.');
    }
  }, [verified]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailNotVerified(false);

    try {
      await login({ email, password });
      showSuccessToast('Добро пожаловать! 🌱');
      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const responseData = axiosError?.response?.data;
      const code = responseData?.code ||
        (typeof responseData?.message === 'object' ? responseData?.message?.code : undefined);
      if (code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
      }
      // Other errors handled automatically via axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.resendVerification(email);
      setResendDone(true);
      showSuccessToast('Письмо отправлено! Проверьте почту.');
    } catch {
      // silently fail
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        {reasonMessage && (
          <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
            <ShieldX className="h-4 w-4" />
            <AlertDescription>{reasonMessage}</AlertDescription>
          </Alert>
        )}

        {emailNotVerified && (
          <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <MailWarning className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>Email не подтверждён. Проверьте почту или запросите новое письмо.</p>
              {!resendDone ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={resendLoading || !email}
                  className="mt-1"
                >
                  {resendLoading ? 'Отправка...' : 'Отправить письмо повторно'}
                </Button>
              ) : (
                <p className="text-sm font-medium">Письмо отправлено!</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Image src="/logo.svg" alt="PlantSheep" width={32} height={32} />
              </div>
            </div>

            <div>
              <CardTitle>С возвращением</CardTitle>
              <CardDescription className="pt-2">
                Войдите в свой аккаунт для продолжения
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-1">
              <div className="space-y-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Пароль</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Забыли пароль?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>

              <div className="text-sm text-center text-muted-foreground">
                Нет аккаунта?{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Создать аккаунт
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
