import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPlantDetailClient from './PublicPlantDetailClient';
import { getPublicPlantPageData } from '@/lib/server/public-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';

interface Props {
  params: Promise<{ plantId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { plantId } = await params;
    const res = await fetch(`${API_URL}/plants/public/${plantId}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
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
      owner?: { _id?: string; name: string };
    } = await res.json();

    const genus = plant.genusId;
    const variety = plant.varietyId;
    const plantName =
      [
        genus?.nameRu || genus?.nameEn || genus?.nameLatin,
        variety?.nameRu || variety?.nameEn || variety?.nameLatin,
      ]
        .filter(Boolean)
        .join(' — ') || 'Растение';

    const ownerName = plant.owner?.name;
    const canonicalUrl = plant.owner?._id
      ? `${SITE_URL}/profile/${plant.owner._id}/plants/${plantId}`
      : `${SITE_URL}/public/${plantId}`;
    const title = ownerName ? `${plantName} · ${ownerName}` : plantName;
    const description = plant.description
      ? plant.description.slice(0, 160)
      : `${plantName}${ownerName ? ` из коллекции ${ownerName}` : ''} на PlantSheep.`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} — PlantSheep`,
        description,
        url: `${SITE_URL}/public/${plantId}`,
        ...(plant.photo && {
          images: [
            {
              url: `${API_URL}/plants/photo/${plant.photo}`,
              width: 600,
              height: 600,
              alt: plantName,
            },
          ],
        }),
      },
      twitter: {
        card: plant.photo ? 'summary_large_image' : 'summary',
        title: `${title} — PlantSheep`,
        description,
      },
      alternates: { canonical: canonicalUrl },
      robots: {
        index: false,
        follow: true,
      },
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
  const { plantId } = await params;
  const { status, plant, history } = await getPublicPlantPageData(plantId);

  if (status === 404) {
    notFound();
  }

  return <PublicPlantDetailClient initialPlant={plant} initialHistory={history} />;
}
