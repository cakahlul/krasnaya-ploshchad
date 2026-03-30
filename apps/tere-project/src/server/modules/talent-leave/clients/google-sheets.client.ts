import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import type { CalendarCell } from '@shared/types/talent-leave.types';
import type { SprintInfo, TeamGroupData } from '../utils/calendar-data-transformer';
import {
  buildHeaderFormat, buildTeamHeaderFormat, buildSprintCellFormat,
  buildMemberCellFormat, buildLeaveDateCellFormat, buildFreezeRequest,
  buildColumnWidthRequest, buildRowHeightRequest,
} from '../utils/spreadsheet-style-builder';

export class GoogleSheetsClient {
  private initializeClients(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    return { sheets };
  }

  async createSpreadsheet(
    title: string,
    teamGroups: TeamGroupData[],
    dateColumns: CalendarCell[],
    sprintGroups: Record<string, SprintInfo>,
    accessToken: string,
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const { sheets } = this.initializeClients(accessToken);
    const { values, requests } = this.buildSpreadsheetStructure(teamGroups, dateColumns, sprintGroups);

    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [{ properties: { title: 'Leave Calendar', gridProperties: { rowCount: values.length, columnCount: 4 + dateColumns.length } } }],
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = createResponse.data.spreadsheetUrl;
    const sheetId = createResponse.data.sheets?.[0]?.properties?.sheetId;

    if (!spreadsheetId || !spreadsheetUrl || sheetId === undefined) throw new Error('Failed to create spreadsheet');

    const updatedRequests = this.updateSheetIdInRequests(requests, sheetId || 0);

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'RAW', data: [{ range: 'Leave Calendar!A1', values }] },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: updatedRequests },
    });

    return { spreadsheetId, spreadsheetUrl };
  }

  private updateSheetIdInRequests(requests: any[], sheetId: number): any[] {
    return requests.map((request) => {
      if (request.repeatCell?.range?.sheetId !== undefined) return { ...request, repeatCell: { ...request.repeatCell, range: { ...request.repeatCell.range, sheetId } } };
      if (request.mergeCells?.range?.sheetId !== undefined) return { ...request, mergeCells: { ...request.mergeCells, range: { ...request.mergeCells.range, sheetId } } };
      if (request.updateSheetProperties?.properties?.sheetId !== undefined) return { ...request, updateSheetProperties: { ...request.updateSheetProperties, properties: { ...request.updateSheetProperties.properties, sheetId } } };
      if (request.updateDimensionProperties?.range?.sheetId !== undefined) return { ...request, updateDimensionProperties: { ...request.updateDimensionProperties, range: { ...request.updateDimensionProperties.range, sheetId } } };
      return request;
    });
  }

  private buildSpreadsheetStructure(teamGroups: TeamGroupData[], dateColumns: CalendarCell[], sprintGroups: Record<string, SprintInfo>): { values: any[][]; requests: any[] } {
    const values: any[][] = [];
    const requests: any[] = [];
    let currentRow = 0;

    const headerRow = ['No', 'Nama', 'Jumlah', 'Tanggal Cuti'];
    dateColumns.forEach((cell) => { headerRow.push(`${cell.dayNumber}\n${cell.dayName}`); });
    values.push(headerRow);
    currentRow++;

    const headerFormats = buildHeaderFormat(dateColumns);
    requests.push({ repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 + dateColumns.length }, cell: { userEnteredFormat: headerFormats[0] }, fields: 'userEnteredFormat' } });
    headerFormats.forEach((format, index) => {
      requests.push({ repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: index, endColumnIndex: index + 1 }, cell: { userEnteredFormat: format }, fields: 'userEnteredFormat' } });
    });

    teamGroups.forEach((teamGroup) => {
      const teamRowData = this.buildTeamRows(teamGroup, dateColumns, sprintGroups, currentRow);
      values.push(...teamRowData.values);
      requests.push(...teamRowData.requests);
      currentRow += teamRowData.values.length;
    });

    requests.push(buildFreezeRequest());
    requests.push(buildColumnWidthRequest(0, 60));
    requests.push(buildColumnWidthRequest(1, 150));
    requests.push(buildColumnWidthRequest(2, 80));
    requests.push(buildColumnWidthRequest(3, 180));
    for (let i = 0; i < dateColumns.length; i++) requests.push(buildColumnWidthRequest(4 + i, 70));
    requests.push(buildRowHeightRequest(0, 80));

    return { values, requests };
  }

  private buildTeamRows(teamGroup: TeamGroupData, dateColumns: CalendarCell[], sprintGroups: Record<string, SprintInfo>, startRowIndex: number): { values: any[][]; requests: any[] } {
    const values: any[][] = [];
    const requests: any[] = [];
    let currentRow = startRowIndex;

    const teamHeader = buildTeamHeaderFormat(currentRow, teamGroup.teamName, teamGroup.memberCount);
    const teamHeaderRow = ['', teamHeader.value, '', ''];
    const sprintEntries = Object.entries(sprintGroups);
    let dateIndex = 0;

    sprintEntries.forEach(([sprintName, sprintInfo]) => {
      const sprintFormat = buildSprintCellFormat(currentRow, sprintName, 4 + dateIndex, sprintInfo.dateCount);
      requests.push(sprintFormat.mergeRequest);
      requests.push({ repeatCell: { range: { sheetId: 0, startRowIndex: currentRow, endRowIndex: currentRow + 1, startColumnIndex: 4 + dateIndex, endColumnIndex: 4 + dateIndex + 1 }, cell: { userEnteredValue: { stringValue: sprintFormat.value }, userEnteredFormat: sprintFormat.format }, fields: 'userEnteredValue,userEnteredFormat' } });
      dateIndex += sprintInfo.dateCount;
    });

    values.push(teamHeaderRow);
    requests.push(teamHeader.mergeRequest);
    requests.push({ repeatCell: { range: { sheetId: 0, startRowIndex: currentRow, endRowIndex: currentRow + 1, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredValue: { stringValue: teamHeader.value }, userEnteredFormat: teamHeader.format }, fields: 'userEnteredValue,userEnteredFormat' } });
    requests.push(buildRowHeightRequest(currentRow, 60));
    currentRow++;

    teamGroup.members.forEach((member, index) => {
      const memberRow = this.buildMemberRow(member, dateColumns, currentRow, index + 1);
      values.push(memberRow.values);
      requests.push(...memberRow.requests);
      requests.push(buildRowHeightRequest(currentRow, 40));
      currentRow++;
    });

    return { values, requests };
  }

  private buildMemberRow(member: any, dateColumns: CalendarCell[], rowIndex: number, rowNumber: number): { values: any[]; requests: any[] } {
    const requests: any[] = [];
    const row: any[] = [rowNumber, member.name, member.leaveCount, member.dateRange];

    dateColumns.forEach((cell, colIndex) => {
      const isLeaveDate = member.leaveDates.includes(cell.date);
      const status = member.leaveDatesWithStatus[cell.date];
      row.push(isLeaveDate ? '✓' : '');
      const format = buildLeaveDateCellFormat(cell, isLeaveDate, status);
      requests.push({ repeatCell: { range: { sheetId: 0, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 4 + colIndex, endColumnIndex: 4 + colIndex + 1 }, cell: { userEnteredFormat: format }, fields: 'userEnteredFormat' } });
    });

    [['no', 0, 1], ['name', 1, 2], ['count', 2, 3], ['dateRange', 3, 4]].forEach(([type, start, end]) => {
      requests.push({ repeatCell: { range: { sheetId: 0, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: start as number, endColumnIndex: end as number }, cell: { userEnteredFormat: buildMemberCellFormat(type as string, type === 'count' ? member.leaveCount : undefined) }, fields: 'userEnteredFormat' } });
    });

    return { values: row, requests };
  }
}

export const googleSheetsClient = new GoogleSheetsClient();
