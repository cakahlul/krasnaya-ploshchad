import { withAuth } from '@server/auth/with-auth';
import { searchService } from '@server/modules/search/search.service';

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limit = Number(searchParams.get('limit') ?? 6);
  const offset = Number(searchParams.get('offset') ?? 0);
  const nextPageToken = searchParams.get('nextPageToken') ?? undefined;

  const result = await searchService.searchTickets(q, limit, offset, nextPageToken);
  return Response.json(result);
});

export const POST = withAuth(async (req) => {
  const body = await req.json() as { keys: string[] };
  if (!Array.isArray(body.keys)) {
    return Response.json({ message: 'keys array is required' }, { status: 400 });
  }
  const tickets = await searchService.getTicketDetailBatch(body.keys);
  return Response.json(tickets);
});
