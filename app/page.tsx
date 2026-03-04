'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import {
  Leaf,
  BarChart3,
  BookOpen,
  Share2,
  ArrowRight,
  Layers,
  Camera,
  Users,
  Globe,
  Eye,
  Link2,
} from 'lucide-react';

const features = [
  {
    icon: Leaf,
    title: 'Коллекция растений',
    description:
      'Создайте личную библиотеку с описаниями, фотографиями и заметками для каждого растения.',
  },
  {
    icon: BarChart3,
    title: 'История роста',
    description:
      'Фиксируйте изменения: пересадки, цветение, лечение болезней — вся жизнь растения в одной ленте.',
  },
  {
    icon: Layers,
    title: 'Полки и зоны',
    description:
      'Организуйте растения по местам — балкон, подоконник, теплица. Удобная структура для любой коллекции.',
  },
  {
    icon: BookOpen,
    title: 'База видов',
    description:
      'Привязывайте растения к роду и сорту из обширной базы. Находите правильные названия быстро.',
  },
  {
    icon: Camera,
    title: 'Фотоальбом',
    description:
      'Загружайте несколько фото к каждой записи истории и наблюдайте за преображением растения.',
  },
  {
    icon: Share2,
    title: 'Публичный профиль',
    description:
      'Делитесь коллекцией с сообществом или скрывайте данные — полный контроль приватности.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Добавьте растение',
    description: 'Укажите вид, сорт, загрузите фото и опишите, где оно стоит.',
  },
  {
    number: '02',
    title: 'Ведите историю',
    description: 'Записывайте уход, наблюдения и события — с датами и фотографиями.',
  },
  {
    number: '03',
    title: 'Наблюдайте за ростом',
    description: 'Смотрите полную хронику жизни каждого растения и делитесь с другими.',
  },
];

const communityItems = [
  { icon: Globe, text: 'Публичная страница с вашими растениями и полками' },
  { icon: Eye, text: 'Раздельный контроль видимости разделов' },
  { icon: Link2, text: 'Ссылка на профиль, которой можно поделиться' },
];

export default function HomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-semibold text-sm">PlantSheep</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Открыть панель</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Войти</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Начать бесплатно</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
            <Leaf className="w-3.5 h-3.5" />
            Трекер коллекции растений
          </div>

          {/* Logo + Title */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
                <Logo size="lg" />
              </div>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
              <span className="text-primary">Plant</span>
              <span className="text-foreground">Sheep</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Ведите цифровой дневник своей коллекции растений. Отслеживайте историю, организуйте по
              полкам и делитесь с сообществом — всё в одном месте.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {user ? (
              <Button asChild size="lg" className="px-10 gap-2">
                <Link href="/dashboard">
                  Открыть панель <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="px-10 gap-2">
                  <Link href="/register">
                    Начать бесплатно <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-10">
                  <Link href="/login">Уже есть аккаунт</Link>
                </Button>
              </>
            )}
          </div>

          {/* Decorative stat pills */}
          <div className="flex flex-wrap justify-center gap-3 pt-6">
            {[
              { emoji: '🌿', text: 'Любое количество растений' },
              { emoji: '📸', text: 'Фото для каждой записи' },
              { emoji: '🔒', text: 'Гибкая приватность' },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm text-muted-foreground"
              >
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              Возможности
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">Всё для вашей коллекции</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Инструменты, которые нужны коллекционеру растений — от первой посадки до публичного
              профиля
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">
              Как это работает
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">Просто начать</h2>
          </div>

          <div className="relative">
            {/* Single connector line behind all badges */}
            <div className="hidden md:block absolute top-6 left-[calc(100%/6)] right-[calc(100%/6)] h-px bg-border" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold relative z-10">
                    {step.number}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-card border border-border p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-widest">
                  Сообщество
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Вдохновляйте других коллекционеров
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Создайте публичный профиль и откройте свою коллекцию сообществу. Делитесь
                  редкими видами, показывайте полки и документируйте историю роста.
                </p>
              </div>
              <div className="space-y-4">
                {communityItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Начните вести коллекцию сегодня
          </h2>
          <p className="text-muted-foreground">
            Бесплатно. Без ограничений. Ваши растения заслуживают заботы и внимания.
          </p>
          {user ? (
            <Button asChild size="lg" className="px-12 gap-2">
              <Link href="/dashboard">
                Открыть панель <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-12 gap-2">
                <Link href="/register">
                  Создать аккаунт <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-12">
                <Link href="/login">Войти</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span>PlantSheep</span>
          </div>
          <p>Трекер коллекции растений</p>
        </div>
      </footer>
    </div>
  );
}
