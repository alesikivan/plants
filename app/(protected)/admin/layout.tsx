'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Role } from '@/lib/types/user';
import {
  Users,
  Leaf,
  Layers,
  BookOpen,
  Tag,
  History,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/genus', label: 'Роды', icon: BookOpen },
  { href: '/admin/variety', label: 'Сорта', icon: Tag },
  { href: '/admin/plants', label: 'Растения', icon: Leaf },
  { href: '/admin/shelves', label: 'Полки', icon: Layers },
  { href: '/admin/plant-history', label: 'История растений', icon: History },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized) return;
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/dashboard');
    }
  }, [user, initialized, router]);

  if (!initialized || !user) return null;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col gap-1 w-52 shrink-0">
        <div className="flex items-center gap-2 mb-4 px-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Администрирование</span>
        </div>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile nav */}
        <div className="md:hidden mb-4 border-b border-border pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 border ${
                    active
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
