import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
