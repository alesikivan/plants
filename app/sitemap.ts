import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

type SitemapItem = {
  id: string;
  updatedAt?: string;
};

type SitemapUser = {
  id: string;
  updatedAt?: string;
  showPlants: boolean;
  showShelves: boolean;
  plants: SitemapItem[];
  shelves: SitemapItem[];
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  try {
    const res = await fetch(`${API_URL}/users/seo/sitemap`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const users: SitemapUser[] = await res.json();
      const routes: MetadataRoute.Sitemap = [];

      for (const user of users) {
        routes.push({
          url: `${SITE_URL}/profile/${user.id}`,
          ...(user.updatedAt ? { lastModified: new Date(user.updatedAt) } : {}),
          changeFrequency: 'weekly',
          priority: 0.7,
        });

        if (user.showPlants) {
          routes.push({
            url: `${SITE_URL}/profile/${user.id}/plants`,
            ...(user.updatedAt ? { lastModified: new Date(user.updatedAt) } : {}),
            changeFrequency: 'weekly',
            priority: 0.6,
          });

          for (const plant of user.plants) {
            routes.push({
              url: `${SITE_URL}/profile/${user.id}/plants/${plant.id}`,
              ...(plant.updatedAt ? { lastModified: new Date(plant.updatedAt) } : {}),
              changeFrequency: 'weekly',
              priority: 0.6,
            });
          }
        }

        if (user.showShelves) {
          routes.push({
            url: `${SITE_URL}/profile/${user.id}/shelves`,
            ...(user.updatedAt ? { lastModified: new Date(user.updatedAt) } : {}),
            changeFrequency: 'weekly',
            priority: 0.6,
          });

          for (const shelf of user.shelves) {
            routes.push({
              url: `${SITE_URL}/profile/${user.id}/shelves/${shelf.id}`,
              ...(shelf.updatedAt ? { lastModified: new Date(shelf.updatedAt) } : {}),
              changeFrequency: 'weekly',
              priority: 0.5,
            });
          }
        }
      }

      return [...staticRoutes, ...routes];
    }
  } catch {
    // If API is unavailable, return only static routes
  }

  return staticRoutes;
}
