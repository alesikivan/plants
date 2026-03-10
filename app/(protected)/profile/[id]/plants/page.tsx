import type { Metadata } from 'next';
import UserPlantsClient from './UserPlantsClient';

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

    if (!res.ok) return { title: 'Растения пользователя' };

    const profile: { name: string; stats: { totalPlants: number } } = await res.json();

    return {
      title: `Растения ${profile.name}`,
      description: `Коллекция растений пользователя ${profile.name} на PlantSheep — ${profile.stats.totalPlants} растений.`,
      openGraph: {
        title: `Растения ${profile.name} — PlantSheep`,
        url: `${SITE_URL}/profile/${id}/plants`,
      },
      alternates: { canonical: `${SITE_URL}/profile/${id}/plants` },
    };
  } catch {
    return { title: 'Растения пользователя' };
  }
}

export default function Page() {
  return <UserPlantsClient />;
}
