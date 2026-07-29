import { google } from 'googleapis';
import { generateReportByDateRange } from './reports.service';
import { boardsService } from '@server/modules/boards/boards.service';
import type { generateProductivitySummaryRange } from './productivity-summary-range.service';

export interface ProductivitySummaryMemberDto {
  name: string;
  team: string;
  wpProduct: number;
  wpTech: number;
  wpTotal: number;
  workingDays: number;
  averageWp: number;
  expectedAverageWp: number;
  spProduct: number;
  spTechDebt: number;
  /** Direct Story Points from meeting tickets (ALL-Meeting prefix). Not converted via WP. */
  spMeeting: number;
  spTotal: number;
  /** WP-based productivity: (Total WP / Target WP) × 100% */
  wpProductivity: string;
  /** SP-based productivity: (SP Total / (Working Days × 8)) × 100% */
  productivityRate: string;
}

export interface ProductivitySummaryResponseDto {
  summary: {
    totalDaysOfWorks: number;
    totalWpExpected: number;
    averageWpExpected: number;
    productivityExpected: number;
    totalWpProduced: number;
    averageWpProduced: number;
    productivityProduced: number;
    productivityProduceVsExpected: number;
  };
  details: ProductivitySummaryMemberDto[];
}

export type ProductivitySummaryRangeResponse = Awaited<ReturnType<typeof generateProductivitySummaryRange>>;

export function buildProductivitySummaryRangeSheet(data: ProductivitySummaryRangeResponse) {
  const rangeLabel = `${data.range.startMonth} to ${data.range.endMonth}`;
  const rules = new Map(data.coverage.months.flatMap(month =>
    month.appliedRules.map(rule => [`${month.month}:${rule.group}`, rule.ruleVersion] as const)
  ));
  const failures = data.coverage.months.flatMap(month => month.failures.map(failure => [
    month.month,
    failure.scope,
    failure.group ?? '',
    failure.board ?? '',
    failure.reason,
  ]));
  const available = (value: number | null) => value ?? '';
  const values = [
    ['Productivity Summary', rangeLabel],
    ['Selected Groups', data.selectedGroups.join(', ')],
    ['Coverage Complete', data.coverage.complete ? 'Yes' : 'No'],
    [],
    ['Month', 'Source', 'Metric Basis', 'Active Members', 'Productivity', 'Bugs Raised'],
    ...data.chart.map(point => [point.month, point.source, point.metricBasis, available(point.activeMembers), available(point.productivityMetric), available(point.bugsRaised)]),
    [],
    ['Details'],
    ['Group', 'Boards', 'Name', 'Month', 'Source', 'Rule', 'Metric Basis', 'SP Total', 'WP Total', 'Working Days'],
    ...data.details.flatMap(member => member.monthly.map(month => [
      member.group,
      [...member.boards].sort().join(', '),
      member.name,
      month.month,
      month.source,
      rules.get(`${month.month}:${member.group}`) ?? '',
      data.metricBasis,
      available(month.spTotal),
      available(month.wpTotal),
      available(month.workingDays),
    ])),
    [],
    ['Coverage Failures'],
    ['Month', 'Scope', 'Group', 'Board', 'Reason'],
    ...(failures.length ? failures : [['None']]),
  ];

  return { title: `Productivity Summary - ${rangeLabel}`, values };
}

export async function exportProductivitySummaryRangeToSpreadsheet(
  data: ProductivitySummaryRangeResponse,
  accessToken: string,
) {
  const { title, values } = buildProductivitySummaryRangeSheet(data);
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  const createResponse = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { sheetId: 0, title: 'Summary', gridProperties: { rowCount: values.length + 10, columnCount: 10 } } }],
    },
  });
  const spreadsheetId = createResponse.data.spreadsheetId!;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: 'USER_ENTERED', data: [{ range: 'Summary!A1', values }] },
  });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [
      { updateSheetProperties: { properties: { sheetId: 0, gridProperties: { frozenRowCount: 5 } }, fields: 'gridProperties.frozenRowCount' } },
      { repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.4, green: 0.3, blue: 0.7 }, textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 14 } } }, fields: 'userEnteredFormat(backgroundColor,textFormat)' } },
    ] },
  });

  return {
    success: true,
    message: 'Spreadsheet created successfully',
    spreadsheetTitle: title,
    spreadsheetUrl: createResponse.data.spreadsheetUrl!,
    range: data.range,
    coverage: data.coverage,
    exportedAt: new Date().toISOString(),
  };
}

function formatToYYYYMMDD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function generateProductivitySummaryBoard(
  month: number,
  year: number,
  team: string,
): Promise<ProductivitySummaryMemberDto[]> {
  const report = await generateReportByDateRange(
    formatToYYYYMMDD(new Date(year, month - 1, 1)),
    formatToYYYYMMDD(new Date(year, month, 0)),
    team,
  );
  return (report.issues || []).map(issue => {
    const wpProduct = issue.weightPointsProduct || 0;
    const wpTech = issue.weightPointsTechDebt || 0;
    const wpTotal = issue.totalWeightPoints || 0;
    const workingDays = issue.workingDays || 0;
    const averageWp = workingDays > 0 ? wpTotal / workingDays : 0;
    const targetWp = issue.targetWeightPoints || 0;
    const expectedAverageWp = workingDays > 0 ? targetWp / workingDays : 0;
    const spBase = targetWp > 0 ? (8 * workingDays) / targetWp : 0;
    const spProduct = wpProduct * spBase;
    const spTechDebt = wpTech * spBase;
    const spMeeting = issue.spMeeting ?? 0;
    const spTotal = spProduct + spTechDebt + spMeeting;
    return {
      name: issue.member, team, wpProduct, wpTech, wpTotal, workingDays, averageWp,
      expectedAverageWp, spProduct, spTechDebt, spMeeting, spTotal,
      wpProductivity: targetWp > 0 ? `${((wpTotal / targetWp) * 100).toFixed(2)}%` : '0.00%',
      productivityRate: workingDays > 0 ? `${((spTotal / (workingDays * 8)) * 100).toFixed(2)}%` : '0.00%',
    };
  });
}

export async function generateProductivitySummary(month: number, year: number, teams?: string[]): Promise<ProductivitySummaryResponseDto> {
  const boards = await boardsService.findAll();

  const filteredBoards = teams && teams.length > 0 ? boards.filter(b => teams.includes(b.shortName)) : boards;

  const teamReports = await Promise.all(filteredBoards.map(board =>
    generateProductivitySummaryBoard(month, year, board.shortName).catch(() => null),
  ));
  const details = teamReports.flatMap(report => report ?? []);
  details.sort((a, b) => a.name.localeCompare(b.name));

  const totalDaysOfWorks = details.reduce((s, m) => s + m.workingDays, 0);
  const totalWpExpected = details.reduce((s, m) => s + m.expectedAverageWp * m.workingDays, 0);
  const averageWpExpected = totalDaysOfWorks > 0 ? totalWpExpected / totalDaysOfWorks : 0;
  const productivityExpected = averageWpExpected / 8;
  const totalWpProduced = details.reduce((s, m) => s + m.wpTotal, 0);
  const averageWpProduced = totalDaysOfWorks > 0 ? totalWpProduced / totalDaysOfWorks : 0;
  const productivityProduced = averageWpProduced / 8;
  const productivityProduceVsExpected = productivityExpected > 0 ? (productivityProduced - productivityExpected) / productivityExpected : 0;

  return { summary: { totalDaysOfWorks, totalWpExpected, averageWpExpected, productivityExpected, totalWpProduced, averageWpProduced, productivityProduced, productivityProduceVsExpected }, details };
}

export async function exportProductivitySummaryToSpreadsheet(month: number, year: number, accessToken: string, teams?: string[]) {
  const data = await generateProductivitySummary(month, year, teams);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthName = monthNames[month - 1] || month.toString();
  const title = `Productivity Summary - ${monthName} ${year}`;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  const safeNumber = (val: number) => (!isFinite(val) ? 0 : Number(val.toFixed(2)));
  const values: any[][] = [
    [`Productivity Summary`, `${monthName} ${year}`, '', '', '', '', '', ''], [],
    ['Metric', 'Value'],
    ['Total Days of Works', data.summary.totalDaysOfWorks],
    ['Total WP Expected', safeNumber(data.summary.totalWpExpected)],
    ['Average WP Expected', safeNumber(data.summary.averageWpExpected)],
    ['Productivity Expected', safeNumber(data.summary.productivityExpected)],
    ['Total WP Produced', safeNumber(data.summary.totalWpProduced)],
    ['Average WP Produced', safeNumber(data.summary.averageWpProduced)],
    ['Productivity Produced', safeNumber(data.summary.productivityProduced)],
    ['Produce vs Expected', `${(data.summary.productivityProduceVsExpected * 100).toFixed(2)}%`],
    [],
    ['Name', 'Team', 'SP Product', 'SP Tech Debt', 'SP Meeting', 'SP Total', 'Productivity Rate', 'Working Days', 'WP Product', 'WP Tech', 'WP Total', 'Avg WP / Day', 'Expected Avg WP'],
    ...data.details.map((m) => [m.name, m.team, Number(m.spProduct.toFixed(2)) || 0, Number(m.spTechDebt.toFixed(2)) || 0, m.spMeeting, Number(m.spTotal.toFixed(2)) || 0, m.productivityRate, m.workingDays, m.wpProduct, m.wpTech, Number(m.wpTotal.toFixed(2)) || 0, Number(m.averageWp.toFixed(2)) || 0, Number(m.expectedAverageWp.toFixed(2)) || 0]),
  ];

  const requests: any[] = [
    { updateSheetProperties: { properties: { sheetId: 0, gridProperties: { frozenRowCount: 13 }, title: 'Summary' }, fields: 'gridProperties.frozenRowCount,title' } },
    { repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.4, green: 0.3, blue: 0.7 }, textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 14 }, horizontalAlignment: 'CENTER' } }, fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)' } },
    { mergeCells: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 }, mergeType: 'MERGE_ALL' } },
    { repeatCell: { range: { sheetId: 0, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 2 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }, textFormat: { bold: true } } }, fields: 'userEnteredFormat(backgroundColor,textFormat)' } },
    { repeatCell: { range: { sheetId: 0, startRowIndex: 12, endRowIndex: 13, startColumnIndex: 0, endColumnIndex: 13 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }, textFormat: { bold: true }, horizontalAlignment: 'CENTER' } }, fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)' } },
  ];

  const createResponse = await sheets.spreadsheets.create({
    requestBody: { properties: { title }, sheets: [{ properties: { sheetId: 0, title: 'Summary', gridProperties: { rowCount: values.length + 10, columnCount: 13 } } }] },
  });

  const spreadsheetId = createResponse.data.spreadsheetId!;
  const spreadsheetUrl = createResponse.data.spreadsheetUrl!;

  await sheets.spreadsheets.values.batchUpdate({ spreadsheetId, requestBody: { valueInputOption: 'USER_ENTERED', data: [{ range: 'Summary!A1', values }] } });
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });

  return {
    success: true,
    message: 'Spreadsheet created successfully',
    spreadsheetTitle: title,
    spreadsheetUrl,
    dateRange: { startDate: `${year}-${String(month).padStart(2, '0')}-01`, endDate: `${year}-${String(month).padStart(2, '0')}-28` },
    exportedAt: new Date().toISOString(),
  };
}
