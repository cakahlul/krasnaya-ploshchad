#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGetSprintReport } from './tools/get-sprint-report.js';
import { registerGetOpenSprintReport } from './tools/get-open-sprint-report.js';
import { registerGetEpics } from './tools/get-epics.js';
import { registerGetProductivitySummary } from './tools/get-productivity-summary.js';
import { registerListSprints } from './tools/list-sprints.js';

const server = new McpServer({
  name: 'tere-report-server',
  version: '1.0.0',
});

registerGetSprintReport(server);
registerGetOpenSprintReport(server);
registerGetEpics(server);
registerGetProductivitySummary(server);
registerListSprints(server);

const transport = new StdioServerTransport();
await server.connect(transport);
