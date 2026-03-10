import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

type CurrentUser = {
  id: string;
};

type Plant = {
  _id: string;
};

type Shelf = {
  _id: string;
};

async function fetchWithCookies<T>(request: NextRequest, path: string): Promise<T | null> {
  const cookie = request.headers.get('cookie');

  const response = await fetch(`${API_URL}${path}`, {
    headers: cookie ? { cookie } : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await fetchWithCookies<CurrentUser>(request, '/users/profile');

    if (!currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [plants, shelves] = await Promise.all([
      fetchWithCookies<Plant[]>(request, '/plants'),
      fetchWithCookies<Shelf[]>(request, '/shelves'),
    ]);

    const userId = currentUser.id;

    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/profile/${userId}/plants`);
    revalidatePath(`/profile/${userId}/shelves`);
    revalidatePath('/sitemap.xml');

    for (const plant of plants ?? []) {
      revalidatePath(`/profile/${userId}/plants/${plant._id}`);
      revalidatePath(`/public/${plant._id}`);
    }

    for (const shelf of shelves ?? []) {
      revalidatePath(`/profile/${userId}/shelves/${shelf._id}`);
    }

    return NextResponse.json({
      ok: true,
      revalidated: {
        profile: true,
        plants: plants?.length ?? 0,
        shelves: shelves?.length ?? 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
