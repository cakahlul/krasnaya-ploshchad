import { withAuth } from '@server/auth/with-auth';
import { firestore } from '@server/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const INITIAL_BOARDS = [
  { boardId: 143, name: 'Funding - DS Board', shortName: 'DS' },
  { boardId: 142, name: 'Lending - SLS Board', shortName: 'SLS' },
];

export const POST = withAuth(async () => {
  const batch = firestore.batch();

  for (const board of INITIAL_BOARDS) {
    const ref = firestore.collection('boards').doc(String(board.boardId));
    batch.set(ref, board, { merge: true });
  }

  await batch.commit();

  return Response.json({ message: `Seeded ${INITIAL_BOARDS.length} boards`, boards: INITIAL_BOARDS }, { status: 201 });
});
