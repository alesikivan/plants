import type { Metadata } from 'next';
import ProfilePageClient from './ProfilePageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.braavo.cloud';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const res = await fetch(`${API_URL}/users/${id}/profile`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return { title: 'Профиль пользователя' };

    const profile: { name: string; stats: { totalPlants: number; totalShelves: number }; avatar?: string } = await res.json();
    const description = `Коллекция растений ${profile.name} на PlantSheep: ${profile.stats.totalPlants} растений, ${profile.stats.totalShelves} полок.`;

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
    return { title: 'Профиль пользователя' };
  }
}

export default function Page() {
  return <ProfilePageClient />;
}
