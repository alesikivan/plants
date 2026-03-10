import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.braavo.cloud';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  try {
    const res = await fetch(`${API_URL}/users/search`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const users: { id: string; updatedAt?: string }[] = await res.json();
      const profileRoutes: MetadataRoute.Sitemap = users.map((user) => ({
        url: `${SITE_URL}/profile/${user.id}`,
        lastModified: user.updatedAt ? new Date(user.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
      return [...staticRoutes, ...profileRoutes];
    }
  } catch {
    // If API is unavailable, return only static routes
  }

  return staticRoutes;
}
