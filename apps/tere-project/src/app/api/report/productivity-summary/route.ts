import { withAuthOrApiKey } from '@server/auth/with-auth-or-api-key';
import { handleProductivitySummaryGet } from '@server/modules/reports/productivity-summary-http';
import { productivitySummaryRangePorts } from '@server/modules/reports/productivity-summary-range.ports';
import { generateProductivitySummary } from '@server/modules/reports/productivity-summary.service';

export const dynamic = 'force-dynamic';

export const GET = withAuthOrApiKey(async (req, { caller }) => {
  return handleProductivitySummaryGet(req, caller, {
    generateLegacy: generateProductivitySummary,
    rangePorts: productivitySummaryRangePorts,
  });
});
