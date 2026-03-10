'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
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
      setValidationError('Пароль должен содержать не менее 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Пароли не совпадают');
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
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к входу
          </Link>
          <Card className="backdrop-blur-xl">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <div>
                <CardTitle>Ссылка недействительна</CardTitle>
                <CardDescription className="pt-2">
                  Ссылка недействительна или устарела. Запросите новую ссылку для сброса пароля.
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter>
              <Link href="/forgot-password" className="w-full">
                <Button className="w-full" size="lg">
                  Запросить новую ссылку
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
                <CardTitle>Пароль изменён</CardTitle>
                <CardDescription className="pt-2">
                  Пароль успешно изменён. Теперь вы можете войти с новым паролем.
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button className="w-full" size="lg">
                  Войти
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
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к входу
        </Link>

        <Card className="backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Image src="/logo.svg" alt="PlantSheep" width={32} height={32} />
              </div>
            </div>
            <div>
              <CardTitle>Новый пароль</CardTitle>
              <CardDescription className="pt-2">Введите новый пароль для вашего аккаунта</CardDescription>
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
                <Label htmlFor="password">Новый пароль</Label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Повторите пароль</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
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
