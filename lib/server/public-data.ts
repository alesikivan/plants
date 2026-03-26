import type { UserProfileWithStats } from '@/lib/api/users';
import type { Plant, PlantHistory } from '@/lib/api/plants';
import type { Shelf } from '@/lib/api/shelves';
import type { Wishlist } from '@/lib/api/wishlist';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';
const REVALIDATE_SECONDS = 60;

type FetchResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
};

type PublicPlant = Plant & {
  showPlantHistory: boolean;
  owner?: { _id: string; name: string };
};

async function fetchJson<T>(path: string, noCache = false): Promise<FetchResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...(noCache ? { cache: 'no-store' } : { next: { revalidate: REVALIDATE_SECONDS } }),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: null,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: (await response.json()) as T,
    };
  } catch {
    return {
      ok: false,
      status: 500,
      data: null,
    };
  }
}

export async function getPublicProfilePageData(userId: string) {
  const [profileResult, plantsResult, shelvesResult, wishlistResult] = await Promise.all([
    fetchJson<UserProfileWithStats>(`/users/${userId}/profile`),
    fetchJson<Plant[]>(`/users/${userId}/plants`),
    fetchJson<Shelf[]>(`/users/${userId}/shelves`),
    fetchJson<Wishlist[]>(`/users/${userId}/wishlist`),
  ]);

  const profile = profileResult.ok ? profileResult.data : null;

  return {
    profile,
    profileStatus: profileResult.status,
    plants: plantsResult.ok ? plantsResult.data ?? [] : [],
    shelves: shelvesResult.ok ? shelvesResult.data ?? [] : [],
    wishlist: wishlistResult.ok ? wishlistResult.data ?? [] : [],
  };
}

export async function getPublicProfilePlantsPageData(userId: string) {
  const result = await fetchJson<Plant[]>(`/users/${userId}/plants`, true);

  return {
    status: result.status,
    plants: result.ok ? result.data ?? [] : [],
    isHidden: result.status === 403,
  };
}

export async function getPublicProfileShelvesPageData(userId: string) {
  const result = await fetchJson<Shelf[]>(`/users/${userId}/shelves`, true);

  return {
    status: result.status,
    shelves: result.ok ? result.data ?? [] : [],
    isHidden: result.status === 403,
  };
}

export async function getPublicProfilePlantPageData(userId: string, plantId: string) {
  const [plantResult, historyResult, profileResult] = await Promise.all([
    fetchJson<Plant>(`/users/${userId}/plants/${plantId}`, true),
    fetchJson<PlantHistory[]>(`/users/${userId}/plants/${plantId}/history`, true),
    fetchJson<UserProfileWithStats>(`/users/${userId}/profile`),
  ]);

  return {
    status: plantResult.status,
    plant: plantResult.ok ? plantResult.data : null,
    history: historyResult.ok ? historyResult.data ?? [] : [],
    profile: profileResult.ok ? profileResult.data : null,
    plantHidden: plantResult.status === 403,
    historyHidden: historyResult.status === 403,
  };
}

export async function getPublicProfileShelfPageData(userId: string, shelfId: string) {
  const result = await fetchJson<Shelf>(`/users/${userId}/shelves/${shelfId}`, true);

  return {
    status: result.status,
    shelf: result.ok ? result.data : null,
    isHidden: result.status === 403,
  };
}

export async function getPublicPlantPageData(plantId: string) {
  const [plantResult, historyResult] = await Promise.all([
    fetchJson<PublicPlant>(`/plants/public/${plantId}`),
    fetchJson<PlantHistory[]>(`/plants/public/${plantId}/history`),
  ]);

  return {
    status: plantResult.status,
    plant: plantResult.ok ? plantResult.data : null,
    history: historyResult.ok ? historyResult.data ?? [] : [],
  };
}
