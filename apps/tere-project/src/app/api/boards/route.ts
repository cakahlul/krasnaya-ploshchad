import { canAccessBoard } from '@server/auth/access-policy';
import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { boardsService } from '@server/modules/boards/boards.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (_req, { caller }) => {
  const boards = await boardsService.findAll();
  return Response.json(boards.filter(board => canAccessBoard(caller, board)));
});
