import { withAuth } from '@server/auth/with-auth';
import { handleProductivitySummaryExportPost } from '@server/modules/reports/productivity-summary-export-http';
import { productivitySummaryRangePorts } from '@server/modules/reports/productivity-summary-range.ports';

export const dynamic = 'force-dynamic';

export const POST = withAuth(req => handleProductivitySummaryExportPost(req, {
  rangePorts: productivitySummaryRangePorts,
}));
