'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
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
    }
  };

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
                {sent ? <MailCheck className="w-8 h-8 text-primary" /> : <Image src="/logo.svg" alt="PlantSheep" width={32} height={32} />}
              </div>
            </div>
            <div>
              <CardTitle>{sent ? 'Проверьте почту' : 'Восстановление пароля'}</CardTitle>
              <CardDescription className="pt-2">
                {sent
                  ? 'Если аккаунт с такой почтой существует, вы получите письмо со ссылкой для сброса пароля.'
                  : 'Введите ваш email и мы отправим ссылку для сброса пароля'}
              </CardDescription>
            </div>
          </CardHeader>

          {!sent ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-3">
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
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Отправка...' : 'Отправить ссылку'}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardFooter className="pt-0">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full" size="lg">
                  Вернуться к входу
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
