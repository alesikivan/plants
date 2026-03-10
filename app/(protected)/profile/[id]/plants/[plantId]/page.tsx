import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import UserPlantDetailClient from './UserPlantDetailClient';
import { getPublicProfilePlantPageData } from '@/lib/server/public-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

interface Props {
  params: Promise<{ id: string; plantId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id, plantId } = await params;
    const [plantRes, profileRes] = await Promise.all([
      fetch(`${API_URL}/users/${id}/plants/${plantId}`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/users/${id}/profile`, { next: { revalidate: 60 } }),
    ]);

    if (plantRes.status === 404) {
      return {
        title: 'Растение',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (plantRes.status === 403) {
      return {
        title: 'Растение',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (!plantRes.ok) {
      return {
        title: 'Растение',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const plant: {
      genusId?: { nameRu?: string; nameEn?: string; nameLatin?: string };
      varietyId?: { nameRu?: string; nameEn?: string; nameLatin?: string };
      description?: string;
      photo?: string;
    } = await plantRes.json();

    const profileName = profileRes.ok ? (await profileRes.json() as { name: string }).name : null;

    const genus = plant.genusId;
    const variety = plant.varietyId;
    const plantName = [
      genus?.nameRu || genus?.nameEn || genus?.nameLatin,
      variety?.nameRu || variety?.nameEn || variety?.nameLatin,
    ].filter(Boolean).join(' — ') || 'Растение';

    const title = profileName ? `${plantName} · ${profileName}` : plantName;
    const description = plant.description
      ? plant.description.slice(0, 160)
      : `${plantName} из коллекции${profileName ? ` ${profileName}` : ''} на PlantSheep.`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} — PlantSheep`,
        description,
        url: `${SITE_URL}/profile/${id}/plants/${plantId}`,
        ...(plant.photo && {
          images: [{ url: `${API_URL}/plants/photo/${plant.photo}`, width: 600, height: 600, alt: plantName }],
        }),
      },
      twitter: {
        card: plant.photo ? 'summary_large_image' : 'summary',
        title: `${title} — PlantSheep`,
        description,
      },
      alternates: { canonical: `${SITE_URL}/profile/${id}/plants/${plantId}` },
    };
  } catch {
    return {
      title: 'Растение',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function Page({ params }: Props) {
  const { id, plantId } = await params;
  const { status, plant, history, plantHidden, historyHidden } = await getPublicProfilePlantPageData(
    id,
    plantId
  );

  if (status === 404) {
    notFound();
  }

  return (
    <UserPlantDetailClient
      initialPlant={plant}
      initialHistory={history}
      initialPlantHidden={plantHidden}
      initialHistoryHidden={historyHidden}
    />
  );
}
