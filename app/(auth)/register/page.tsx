'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/authStore';
import { showErrorToast } from '@/lib/api/error-handler';
import { ErrorType } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';

export default function RegisterPage() {
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
        message: 'Пароли не совпадают',
      });
      return;
    }

    if (password.length < 6) {
      showErrorToast({
        type: ErrorType.VALIDATION,
        message: 'Пароль должен содержать минимум 6 символов',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({ name, email, password });
      if (result?.requiresVerification) {
        setSentEmail(email);
        setVerificationSent(true);
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
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>

          <Card className="backdrop-blur-xl">
            <CardHeader className="text-center space-y-6 pb-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle>Проверьте почту</CardTitle>
                <CardDescription className="pt-2">
                  Письмо с подтверждением отправлено на <span className="font-medium text-foreground">{sentEmail}</span>.
                  Перейдите по ссылке в письме для активации аккаунта.
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Не получили письмо? Проверьте папку «Спам» или{' '}
                <Link href="/login" className="text-primary hover:underline">
                  войдите
                </Link>
                , чтобы запросить повторную отправку.
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
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <Card className="backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Image src="/logo.svg" alt="PlantSheep" width={32} height={32} />
              </div>
            </div>

            <div>
              <CardTitle>Создать аккаунт</CardTitle>
              <CardDescription className="pt-2">
                Начните работу с Растениями уже сегодня
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Иван Иванов"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
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

              <div className="space-y-1">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
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
                {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
              </Button>

              <div className="text-sm text-center text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Войти
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
