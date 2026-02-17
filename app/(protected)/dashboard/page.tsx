'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, TrendingUp, ShieldCheck, User } from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  return (
    <div className="space-y-4 mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Quick Actions */}
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <h2 className="text-2xl font-bold mb-4">Быстрые действия</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => router.push('/plants')}
            className="p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 text-left group hover:scale-105 active:scale-95"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Добавить растение</h3>
              <p className="text-sm text-muted-foreground">Начните отслеживать новое растение</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
