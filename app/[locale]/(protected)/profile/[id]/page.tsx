import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import ProfilePageClient from './ProfilePageClient';
import { getPublicProfilePageData } from '@/lib/server/public-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'PublicProfilePage.metadata' });
    const res = await fetch(`${API_URL}/users/${id}/profile`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return {
        title: t('title'),
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const profile: { name: string; stats: { totalPlants: number; totalShelves: number }; avatar?: string } = await res.json();
    const description = t('description', {
      name: profile.name,
      plants: profile.stats.totalPlants,
      shelves: profile.stats.totalShelves,
    });

    return {
      title: profile.name,
      description,
      openGraph: {
        title: `${profile.name} — PlantSheep`,
        description,
        url: `${SITE_URL}/profile/${id}`,
        ...(profile.avatar && {
          images: [{ url: `${API_URL}/users/avatar/${profile.avatar}`, width: 200, height: 200, alt: profile.name }],
        }),
      },
      twitter: {
        card: 'summary',
        title: `${profile.name} — PlantSheep`,
        description,
      },
      alternates: { canonical: `${SITE_URL}/profile/${id}` },
    };
  } catch {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'PublicProfilePage.metadata' });
    return { title: t('title') };
  }
}

export default async function Page({ params }: Props) {
  const { id, locale } = await params;
  const { profile, profileStatus, plants, shelves } = await getPublicProfilePageData(id);

  if (profileStatus === 404 || !profile) {
    notFound();
  }

  return (
    <ProfilePageClient
      initialProfile={profile}
      initialPlants={plants}
      initialShelves={shelves}
    />
  );
}
