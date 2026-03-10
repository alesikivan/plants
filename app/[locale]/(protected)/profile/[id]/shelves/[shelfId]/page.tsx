import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UserShelfDetailClient from './UserShelfDetailClient';
import { getPublicProfileShelfPageData } from '@/lib/server/public-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

interface Props {
  params: Promise<{ id: string; shelfId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id, shelfId } = await params;
    const [shelfRes, profileRes] = await Promise.all([
      fetch(`${API_URL}/users/${id}/shelves/${shelfId}`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/users/${id}/profile`, { next: { revalidate: 60 } }),
    ]);

    if (shelfRes.status === 404) {
      return {
        title: 'Полка',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (shelfRes.status === 403) {
      return {
        title: 'Полка',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (!shelfRes.ok) {
      return {
        title: 'Полка',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const shelf: { name: string; photo?: string; plants?: unknown[] } = await shelfRes.json();
    const profileName = profileRes.ok ? (await profileRes.json() as { name: string }).name : null;

    const plantsCount = Array.isArray(shelf.plants) ? shelf.plants.length : 0;
    const title = profileName ? `${shelf.name} · ${profileName}` : shelf.name;
    const description = `Полка «${shelf.name}»${profileName ? ` пользователя ${profileName}` : ''} на PlantSheep — ${plantsCount} растений.`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} — PlantSheep`,
        description,
        url: `${SITE_URL}/profile/${id}/shelves/${shelfId}`,
        ...(shelf.photo && {
          images: [{ url: `${API_URL}/shelves/photo/${shelf.photo}`, width: 600, height: 600, alt: shelf.name }],
        }),
      },
      twitter: {
        card: shelf.photo ? 'summary_large_image' : 'summary',
        title: `${title} — PlantSheep`,
        description,
      },
      alternates: { canonical: `${SITE_URL}/profile/${id}/shelves/${shelfId}` },
    };
  } catch {
    return {
      title: 'Полка',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function Page({ params }: Props) {
  const { id, shelfId } = await params;
  const { status, shelf, isHidden } = await getPublicProfileShelfPageData(id, shelfId);

  if (status === 404) {
    notFound();
  }

  return <UserShelfDetailClient initialShelf={shelf} initialHidden={isHidden} />;
}
