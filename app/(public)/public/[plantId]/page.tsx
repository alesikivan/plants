import type { Metadata } from 'next';
import PublicPlantDetailClient from './PublicPlantDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.braavo.cloud';

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
      owner?: { name: string };
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
      alternates: { canonical: `${SITE_URL}/public/${plantId}` },
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

export default function Page() {
  return <PublicPlantDetailClient />;
}
