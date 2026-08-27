import { getDb } from '@/api/_fixtures/store';
import { getMenuForRole } from '@/shared/config/menu';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized: missing x-user-id header' },
      { status: 401 }
    );
  }

  const { users } = getDb();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid user' },
      { status: 401 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = user;
  const menu = getMenuForRole(user.role);

  return NextResponse.json({
    user: userWithoutPassword,
    role: user.role,
    defaultLocationId: user.defaultLocationId,
    locationIds: user.locationIds,
    menu,
  });
}
