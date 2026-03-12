import { getTranslations } from 'next-intl/server';
import { Logo } from '@/components/logo';
import {
  Leaf, BarChart3, BookOpen, Share2, Layers, Camera,
  Globe, Eye, Link2, ArrowRight, Sprout, CheckCircle2,
  Flower2, Activity, Heart, Users,
} from 'lucide-react';
import Image from 'next/image';
import { HomeAuthButtons } from '@/components/home/HomeAuthButtons';
import { LocaleSwitcher } from '@/components/home/LocaleSwitcher';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
const featureIcons = [Leaf, BarChart3, Layers, BookOpen, Camera, Share2];
const communityIcons = [Globe, Eye, Link2];

type ItemWithTitle = { title: string; description: string };
type StepItem = ItemWithTitle & { number: string };
type StatItem = { emoji: string; text: string };

const trustStatIcons = [Leaf, Activity, BookOpen, Camera];

type TrustStatItem = { value: string; label: string };

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('HomePage');
  const stats = t.raw('stats.items') as StatItem[];
  const features = t.raw('features.items') as ItemWithTitle[];
  const steps = t.raw('steps.items') as StepItem[];
  const communityItems = t.raw('community.items') as string[];
  const trustStats = t.raw('trustStats') as TrustStatItem[];


  return (
    <div className="min-h-screen bg-background">

      {/* ═══ NAV ═══════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <div className="font-semibold text-lg tracking-tight">
              <span className="text-primary">Plant</span>
              <span className="text-foreground">Sheep</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher locale={locale} />
            <HomeAuthButtons variant="nav" />
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="relative pt-28 pb-14 sm:pt-36 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/6 rounded-full blur-3xl" />
          <div className="absolute -top-24 -left-40 w-[500px] h-[500px] bg-primary/7 rounded-full blur-3xl" />
          <div className="absolute top-32 -right-28 w-96 h-96 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-primary/4 rounded-full blur-3xl" />
        </div>

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.018] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-widest">
            <Leaf className="w-3.5 h-3.5 flex-shrink-0" />
            {t('badge')}
          </div>

          {/* Logo with glow */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/25 rounded-[28px] blur-2xl scale-125 opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-28 h-28 bg-gradient-to-br from-primary/15 to-primary/5 rounded-[28px] flex items-center justify-center border border-primary/25 shadow-xl shadow-primary/10">
                <Logo size="lg" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-5">
            <h1
              className="text-6xl sm:text-8xl font-bold tracking-tight leading-none"
            >
              <span className="text-primary">Plant</span>
              <span className="text-foreground">Sheep</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <HomeAuthButtons variant="hero" />
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap justify-center gap-2.5 pt-4">
            {stats.map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 border border-border hover:border-primary/35 hover:bg-primary/5 transition-all duration-200 shadow-sm text-sm text-muted-foreground cursor-default"
              >
                <span>{item.emoji}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST STATS STRIP ══════════════════════════════════════════════ */}
      <section className="py-10 sm:py-14 bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {trustStats.map(({ value, label }, index) => {
              const Icon = trustStatIcons[index];
              return (
                <div
                  key={label}
                  className="flex flex-col items-center text-center gap-3 group"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors duration-200">
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <p className="text-4xl sm:text-5xl font-bold text-primary-foreground leading-none">
                    {value}
                  </p>
                  <p className="text-sm text-primary-foreground/65 leading-tight">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.22em]">
              {t('features.eyebrow')}
            </p>
            <h2
              className="text-3xl sm:text-5xl font-bold tracking-tight"
            >
              {t('features.title')}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
              {t('features.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => {
              const Icon = featureIcons[index];
              const num = String(index + 1).padStart(2, '0');
              return (
                <div
                  key={feature.title}
                  className="group relative p-7 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Watermark number */}
                  <span
                    className="absolute top-3 right-5 text-7xl font-bold text-border/50 select-none group-hover:text-primary/8 transition-colors duration-300 leading-none"
                  >
                    {num}
                  </span>

                  {/* Top-right gradient accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/4 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/6 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/15 transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base sm:text-lg">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <p className="text-xs font-bold text-primary uppercase tracking-[0.22em]">
              {t('steps.eyebrow')}
            </p>
            <h2
              className="text-3xl sm:text-5xl font-bold tracking-tight"
            >
              {t('steps.title')}
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dashed connector (desktop) */}
            <div className="hidden md:block absolute top-[2.75rem] left-[calc(33.33%/2+1.5rem)] right-[calc(33.33%/2+1.5rem)] h-px pointer-events-none">
              <div
                className="w-full h-px border-t-2 border-dashed border-primary/35"
                style={{ backgroundSize: '12px 2px' }}
              />
            </div>

            {steps.map((step) => (
              <div
                key={step.number}
                className="flex flex-col items-center text-center group"
              >
                {/* Step badge with glow */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                  <div className="relative w-[4.5rem] h-[4.5rem] rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-300">
                    <span
                      className="text-2xl font-bold leading-none"
                    >
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Card */}
                <div className="w-full flex-1 p-6 rounded-2xl bg-card border border-border group-hover:border-primary/35 group-hover:shadow-lg group-hover:shadow-primary/5 transition-all duration-300 space-y-3">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMMUNITY ══════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-lg shadow-black/[0.04]">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[460px]">

              {/* Left: Content */}
              <div className="p-8 sm:p-12 flex flex-col justify-center space-y-7">
                <div className="space-y-4">
                  <p className="text-xs font-bold text-primary uppercase tracking-[0.22em]">
                    {t('community.eyebrow')}
                  </p>
                  <h2
                    className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight"
                  >
                    {t('community.title')}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('community.description')}
                  </p>
                </div>

                <ul className="space-y-4">
                  {communityItems.map((item, index) => {
                    const Icon = communityIcons[index];
                    return (
                      <li key={item} className="flex items-start gap-3.5 group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 group-hover:bg-primary/15 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm leading-relaxed pt-1">{item}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-wrap gap-3 pt-1">
                  <HomeAuthButtons variant="final" />
                </div>
              </div>

              {/* Right: Visual profile mockup */}
              <div className="relative bg-gradient-to-br from-primary/8 via-primary/3 to-transparent border-t md:border-t-0 md:border-l border-border flex items-center justify-center p-8 sm:p-12">
                {/* Decorative blobs inside the panel */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/8 rounded-full blur-xl pointer-events-none" />

                {/* Fake profile card */}
                <div className="relative w-full max-w-[260px] space-y-3">
                  {/* Profile header */}
                  <div className="flex items-center gap-3 mb-6 p-3.5 rounded-2xl bg-background/70 border border-border/70 backdrop-blur-sm shadow-sm">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                      <Sprout className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-20 bg-foreground/15 rounded-full" />
                      <div className="h-2 w-28 bg-muted-foreground/20 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      <Globe className="w-2.5 h-2.5" />
                      <span>Public</span>
                    </div>
                  </div>

                  {/* Mock plant items */}
                  {[
                    { w1: '75%', w2: '55%', hue: 75 },
                    { w1: '60%', w2: '70%', hue: 90 },
                    { w1: '85%', w2: '45%', hue: 110 },
                  ].map(({ w1, w2, hue }, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-background/65 border border-border/60 backdrop-blur-sm hover:border-primary/30 transition-colors shadow-sm"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0"
                        style={{
                          background: `hsl(${hue} 35% 65% / 0.35)`,
                          border: `1.5px solid hsl(${hue} 35% 50% / 0.2)`,
                        }}
                      />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="h-2.5 bg-foreground/15 rounded-full" style={{ width: w1 }} />
                        <div className="h-2 bg-muted-foreground/15 rounded-full" style={{ width: w2 }} />
                      </div>
                      <Leaf className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                    </div>
                  ))}

                  {/* "View more" hint */}
                  <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-primary/60 font-medium">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>View full collection</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEED ═══════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left: description */}
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-bold text-primary uppercase tracking-[0.22em]">
                  {t('feed.eyebrow')}
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                  {t('feed.title')}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('feed.description')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('feed.tabGlobal')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {t('feed.tabGlobalDesc')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('feed.tabFollowing')}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {t('feed.tabFollowingDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: feed image */}
            <Image
              src={t('feed.feedImage')}
              alt={t('feed.title')}
              width={600}
              height={440}
              className="w-2/3 max-w-[280px] mx-auto lg:max-w-none lg:mx-0 h-auto lg:h-[440px] lg:w-auto lg:justify-self-center object-contain"
            />

          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ══════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Background treatment */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute top-8 left-8 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute bottom-8 right-8 w-56 h-56 bg-primary/5 rounded-full blur-2xl" />
        </div>

        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/10">
            <Flower2 className="w-8 h-8" />
          </div>

          <div className="space-y-4">
            <h2
              className="text-3xl sm:text-5xl font-bold tracking-tight"
            >
              {t('cta.title')}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t('cta.description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <HomeAuthButtons variant="final" />
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════════════════════ */}
      <footer className="border-t border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">

            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="font-semibold text-lg">
                  <span className="text-primary">Plant</span>
                  <span>Sheep</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {t('description')}
              </p>
            </div>

            {/* Navigation */}
            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/50">
                Navigation
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    {t('footer.login')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                    {t('footer.register')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Features list */}
            <div className="space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/50">
                Features
              </h4>
              <ul className="space-y-3">
                {features.slice(0, 4).map((f) => (
                  <li key={f.title} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{f.title}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} PlantSheep — {t('badge')}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-primary/60 fill-primary/30" />
              <span>for plant lovers</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
