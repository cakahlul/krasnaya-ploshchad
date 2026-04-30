import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { boardsService } from '@server/modules/boards/boards.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async () => {
  const boards = await boardsService.findAll();
  return Response.json(boards);
});
