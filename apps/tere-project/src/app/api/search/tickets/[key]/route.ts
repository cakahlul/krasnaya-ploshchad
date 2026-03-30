import { withAuth } from '@server/auth/with-auth';
import { searchService } from '@server/modules/search/search.service';

export const GET = withAuth(async (_req, { params }) => {
  const { key } = await params!;
  const ticket = await searchService.getTicketDetail(key);
  if (!ticket) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }
  return Response.json(ticket);
});
