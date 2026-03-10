import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://plantsheep.braavo.cloud';
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
      lastModified: new Date(),
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
          lastModified: user.updatedAt ? new Date(user.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });

        if (user.showPlants) {
          routes.push({
            url: `${SITE_URL}/profile/${user.id}/plants`,
            lastModified: user.updatedAt ? new Date(user.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });

          for (const plant of user.plants) {
            const lastModified = plant.updatedAt ? new Date(plant.updatedAt) : new Date();
            routes.push(
              {
                url: `${SITE_URL}/profile/${user.id}/plants/${plant.id}`,
                lastModified,
                changeFrequency: 'weekly',
                priority: 0.6,
              },
              {
                url: `${SITE_URL}/public/${plant.id}`,
                lastModified,
                changeFrequency: 'weekly',
                priority: 0.5,
              },
            );
          }
        }

        if (user.showShelves) {
          routes.push({
            url: `${SITE_URL}/profile/${user.id}/shelves`,
            lastModified: user.updatedAt ? new Date(user.updatedAt) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          });

          for (const shelf of user.shelves) {
            routes.push({
              url: `${SITE_URL}/profile/${user.id}/shelves/${shelf.id}`,
              lastModified: shelf.updatedAt ? new Date(shelf.updatedAt) : new Date(),
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
