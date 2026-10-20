import { withRole } from '@server/auth/with-role';
import { handleProductivitySummaryExportPost } from '@server/modules/reports/productivity-summary-export-http';
import { productivitySummaryRangePorts } from '@server/modules/reports/productivity-summary-range.ports';

export const dynamic = 'force-dynamic';

export const POST = withRole('Lead', req => handleProductivitySummaryExportPost(req, {
  rangePorts: productivitySummaryRangePorts,
}));
