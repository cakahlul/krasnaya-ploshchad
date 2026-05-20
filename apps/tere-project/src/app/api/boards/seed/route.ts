import { withAuth } from '@server/auth/with-auth';
import { db } from '@server/lib/db';
import { boards } from '@server/db/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const INITIAL_BOARDS = [
  { boardId: 143, name: 'Funding - DS Board', shortName: 'DS' },
  { boardId: 142, name: 'Lending - SLS Board', shortName: 'SLS' },
];

export const POST = withAuth(async () => {
  await db
    .insert(boards)
    .values(INITIAL_BOARDS)
    .onConflictDoUpdate({
      target: boards.boardId,
      set: {
        name: sql`excluded.name`,
        shortName: sql`excluded.short_name`,
      },
    });

  return Response.json(
    { message: `Seeded ${INITIAL_BOARDS.length} boards`, boards: INITIAL_BOARDS },
    { status: 201 },
  );
});
