#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGetSprintReport } from './tools/get-sprint-report.js';
import { registerGetOpenSprintReport } from './tools/get-open-sprint-report.js';
import { registerGetEpics } from './tools/get-epics.js';
import { registerGetProductivitySummary } from './tools/get-productivity-summary.js';
import { registerGetTalentDateLeave } from './tools/get-talent-date-leave.js';
import { registerGetTalentLeave } from './tools/get-talent-leave.js';
import { registerListSprints } from './tools/list-sprints.js';
import { registerGetSprintTrend } from './tools/get-sprint-trend.js';
import { registerGetDashboardSummary } from './tools/get-dashboard-summary.js';
import { registerGetBugMonitoring } from './tools/get-bug-monitoring.js';

const server = new McpServer({
  name: 'tere-report-server',
  version: '1.0.0',
});

registerGetSprintReport(server);
registerGetOpenSprintReport(server);
registerGetEpics(server);
registerGetProductivitySummary(server);
registerGetTalentDateLeave(server);
registerGetTalentLeave(server);
registerListSprints(server);
registerGetSprintTrend(server);
registerGetDashboardSummary(server);
registerGetBugMonitoring(server);

const transport = new StdioServerTransport();
await server.connect(transport);
