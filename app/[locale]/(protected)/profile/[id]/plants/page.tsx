import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import UserPlantsClient from './UserPlantsClient';
import { getPublicProfilePlantsPageData } from '@/lib/server/public-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id, locale } = await params;
    const t = await getTranslations({ locale, namespace: 'PublicProfilePage.plants' });
    const [profileRes, plantsRes] = await Promise.all([
      fetch(`${API_URL}/users/${id}/profile`, {
        next: { revalidate: 60 },
      }),
      fetch(`${API_URL}/users/${id}/plants`, {
        next: { revalidate: 60 },
      }),
    ]);

    if (profileRes.status === 404) {
      return {
        title: t('title'),
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (plantsRes.status === 403) {
      return {
        title: t('title'),
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (!profileRes.ok || !plantsRes.ok) {
      return {
        title: t('title'),
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const profile: { name: string; stats: { totalPlants: number } } = await profileRes.json();

    return {
      title: t('titleWithName', { name: profile.name }),
      description: t('description', { name: profile.name, plants: profile.stats.totalPlants }),
      openGraph: {
        title: `${t('titleWithName', { name: profile.name })} — PlantSheep`,
        url: `${SITE_URL}/profile/${id}/plants`,
      },
      alternates: { canonical: `${SITE_URL}/profile/${id}/plants` },
    };
  } catch {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'PublicProfilePage.plants' });
    return {
      title: t('title'),
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function Page({ params }: Props) {
  const { id, locale } = await params;
  const { status, plants, isHidden } = await getPublicProfilePlantsPageData(id);

  if (status === 404) {
    notFound();
  }

  return <UserPlantsClient initialPlants={plants} initialHidden={isHidden} />;
}
