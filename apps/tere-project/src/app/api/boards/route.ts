import { withAuth } from '@server/auth/with-auth';
import { boardsService } from '@server/modules/boards/boards.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async () => {
  const boards = await boardsService.findAll();
  return Response.json(boards);
});
