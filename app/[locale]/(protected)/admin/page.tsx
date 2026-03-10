'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { Role } from '@/lib/types/user';

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized) return;
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/dashboard');
      return;
    }
    router.replace('/admin/users');
  }, [user, initialized, router]);

  return null;
}
