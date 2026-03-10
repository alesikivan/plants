import type { Metadata } from 'next';
import UserShelvesClient from './UserShelvesClient';

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

    if (!res.ok) return { title: 'Полки пользователя' };

    const profile: { name: string; stats: { totalShelves: number } } = await res.json();

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
    return { title: 'Полки пользователя' };
  }
}

export default function Page() {
  return <UserShelvesClient />;
}
