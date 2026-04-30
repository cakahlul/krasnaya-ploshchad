import { withAuthOrApiKey, type CallerIdentity } from '@server/auth/with-auth-or-api-key';
import { generateProductivitySummary, type ProductivitySummaryResponseDto } from '@server/modules/reports/productivity-summary.service';

export const dynamic = 'force-dynamic';

function filterSummaryForMember(data: ProductivitySummaryResponseDto, caller: CallerIdentity): ProductivitySummaryResponseDto {
  if (caller.isLead || !caller.fullName) return data;
  const myDetails = data.details.filter(d => d.name === caller.fullName);
  return { ...data, details: myDetails };
}

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') ?? '0', 10);
  const year = parseInt(searchParams.get('year') ?? '0', 10);
  if (!month || !year) return Response.json({ message: 'month and year are required' }, { status: 400 });
  const teamsParam = searchParams.get('teams') ?? '';
  const teams = teamsParam ? teamsParam.split(',').map(t => t.trim()).filter(Boolean) : undefined;
  const data = await generateProductivitySummary(month, year, teams);
  return Response.json(caller ? filterSummaryForMember(data, caller) : data);
});
