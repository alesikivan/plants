'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Users, Heart, Sparkles } from 'lucide-react';

export function WishlistDiscoverBanner() {
  const t = useTranslations('WishlistDiscoverBanner');
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 p-6 sm:p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-4 left-8 opacity-10 animate-float" style={{ animationDuration: '6s' }}>
          <Heart className="w-8 h-8 text-primary rotate-45" />
        </div>
        <div className="absolute top-20 right-12 opacity-10 animate-float" style={{ animationDuration: '8s', animationDelay: '1s' }}>
          <Heart className="w-6 h-6 text-primary -rotate-12" />
        </div>
        <div className="absolute bottom-8 right-8 opacity-15 animate-bounce" style={{ animationDuration: '3s' }}>
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4 animate-fade-in" style={{ animationDuration: '0.8s' }}>
          <Users className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">{t('joinCommunity')}</p>
        </div>

        <div className="space-y-3 mb-6 animate-fade-in" style={{ animationDuration: '1s', animationDelay: '0.1s' }}>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground">{t('title')}</h3>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{t('description')}</p>
        </div>

        <div className="animate-fade-in" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }}>
          <Button
            asChild
            size="lg"
            className="relative group px-8 py-6 text-base font-bold bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary hover:via-primary/95 hover:to-primary transition-all duration-300"
          >
            <Link href="/register" className="gap-3 flex items-center justify-center">
              <span className="text-lg">✨</span>
              <span>{t('buttonText')}</span>
              <span className="group-hover:translate-x-2 transition-transform text-lg">→</span>
            </Link>
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in forwards ease-out; }
      `}</style>
    </div>
  );
}
