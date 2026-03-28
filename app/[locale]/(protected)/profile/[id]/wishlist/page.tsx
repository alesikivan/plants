import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import UserWishlistClient from './UserWishlistClient';
import { getPublicProfileWishlistPageData } from '@/lib/server/public-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

interface Props {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'UserWishlistPage' });
    const profileRes = await fetch(`${API_URL}/users/${id}/profile`, {
      next: { revalidate: 60 },
    });

    if (!profileRes.ok) {
      return { title: t('header.title'), robots: { index: false, follow: false } };
    }

    const profile: { name: string } = await profileRes.json();

    return {
      title: `${t('header.title')} — ${profile.name}`,
      openGraph: {
        title: `${t('header.title')} — ${profile.name} — PlantSheep`,
        url: `${SITE_URL}/profile/${id}/wishlist`,
      },
      alternates: { canonical: `${SITE_URL}/profile/${id}/wishlist` },
    };
  } catch {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'UserWishlistPage' });
    return { title: t('header.title'), robots: { index: false, follow: false } };
  }
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { search, page } = await searchParams;
  const pageNum = page ? parseInt(page, 10) : 1;

  const [wishlistData, profileRes] = await Promise.all([
    getPublicProfileWishlistPageData(id, search, pageNum, 20),
    fetch(`${API_URL}/users/${id}/profile`, { next: { revalidate: 60 } }),
  ]);

  if (wishlistData.status === 404) {
    notFound();
  }

  const profileData = profileRes.ok ? await profileRes.json() : null;
  const profileName: string = profileData?.name ?? '';

  return (
    <Suspense>
      <UserWishlistClient
        initialWishlist={wishlistData.wishlist}
        initialHidden={wishlistData.isHidden}
        initialTotal={wishlistData.total}
        initialTotalPages={wishlistData.totalPages}
        initialSearch={search ?? ''}
        initialPage={pageNum}
        profileName={profileName}
        profileId={id}
      />
    </Suspense>
  );
}
