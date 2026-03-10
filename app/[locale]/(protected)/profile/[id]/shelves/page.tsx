import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UserShelvesClient from './UserShelvesClient';
import { getPublicProfileShelvesPageData } from '@/lib/server/public-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const [profileRes, shelvesRes] = await Promise.all([
      fetch(`${API_URL}/users/${id}/profile`, {
        next: { revalidate: 60 },
      }),
      fetch(`${API_URL}/users/${id}/shelves`, {
        next: { revalidate: 60 },
      }),
    ]);

    if (profileRes.status === 404) {
      return {
        title: 'Полки пользователя',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (shelvesRes.status === 403) {
      return {
        title: 'Полки пользователя',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (!profileRes.ok || !shelvesRes.ok) {
      return {
        title: 'Полки пользователя',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const profile: { name: string; stats: { totalShelves: number } } = await profileRes.json();

    return {
      title: `Полки ${profile.name}`,
      description: `Полки пользователя ${profile.name} на PlantSheep — ${profile.stats.totalShelves} полок с растениями.`,
      openGraph: {
        title: `Полки ${profile.name} — PlantSheep`,
        url: `${SITE_URL}/profile/${id}/shelves`,
      },
      alternates: { canonical: `${SITE_URL}/profile/${id}/shelves` },
    };
  } catch {
    return {
      title: 'Полки пользователя',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const { status, shelves, isHidden } = await getPublicProfileShelvesPageData(id);

  if (status === 404) {
    notFound();
  }

  return <UserShelvesClient initialShelves={shelves} initialHidden={isHidden} />;
}
