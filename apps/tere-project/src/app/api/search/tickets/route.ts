import { withAuth } from '@server/auth/with-auth';
import { membersService } from '@server/modules/members/members.service';
import { searchService } from '@server/modules/search/search.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req, { user }) => {
  const member = await membersService.findByEmail(user.email!);
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limit = Number(searchParams.get('limit') ?? 6);
  const offset = Number(searchParams.get('offset') ?? 0);
  const nextPageToken = searchParams.get('nextPageToken') ?? undefined;

  if (!Number.isInteger(limit) || limit < 1 || limit > 50 || !Number.isInteger(offset) || offset < 0 || q.length > 200) {
    return Response.json({ message: 'Invalid search parameters' }, { status: 400 });
  }
  const result = await searchService.searchTickets(q, limit, offset, nextPageToken, member?.isLead ? null : member?.teams?.map(team => team.toUpperCase()) ?? []);
  return Response.json(result);
});

export const POST = withAuth(async (req, { user }) => {
  const member = await membersService.findByEmail(user.email!);
  const body = await req.json().catch(() => null) as { keys?: unknown } | null;
  if (!body || !Array.isArray(body.keys) || body.keys.length > 100 || !body.keys.every(key => typeof key === 'string' && /^[A-Z][A-Z0-9_]*-\d+$/.test(key))) {
    return Response.json({ message: 'keys must contain at most 100 valid issue keys' }, { status: 400 });
  }
  const tickets = await searchService.getTicketDetailBatch([...new Set(body.keys)], member?.isLead ? null : member?.teams?.map(team => team.toUpperCase()) ?? []);
  return Response.json(tickets);
});
