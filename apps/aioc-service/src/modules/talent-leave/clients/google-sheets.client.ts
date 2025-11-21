/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import type { sheets_v4, drive_v3 } from 'googleapis';
import type {
  CalendarCell,
  SprintInfo,
  TeamGroupData,
} from '../interfaces/talent-leave-export.dto';
import {
  buildHeaderFormat,
  buildTeamHeaderFormat,
  buildSprintCellFormat,
  buildMemberCellFormat,
  buildLeaveDateCellFormat,
  buildFreezeRequest,
  buildColumnWidthRequest,
  buildRowHeightRequest,
} from '../utils/spreadsheet-style-builder';

@Injectable()
export class GoogleSheetsClient {
  constructor(private configService: ConfigService) {}

  /**
   * Initialize Google Sheets and Drive API clients with OAuth2 access token
   * @param accessToken - OAuth2 access token from user authorization
   */
  private initializeClients(accessToken: string): {
    sheets: sheets_v4.Sheets;
    drive: drive_v3.Drive;
  } {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    return { sheets, drive };
  }

  /**
   * Get Google OAuth2 client for authorization flow
   */
  getOAuth2Client(): InstanceType<typeof google.auth.OAuth2> {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_OAUTH_CLIENT_SECRET',
    );
    const redirectUri = this.configService.get<string>(
      'GOOGLE_OAUTH_REDIRECT_URI',
    );

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'Google OAuth2 credentials not configured',
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Create a new Google Spreadsheet with talent leave data
   * @param title - Spreadsheet title
   * @param teamGroups - Team groups with member data
   * @param dateColumns - Array of date columns
   * @param sprintGroups - Sprint groupings
   * @param accessToken - OAuth2 access token
   * @returns Spreadsheet ID and URL
   */
  async createSpreadsheet(
    title: string,
    teamGroups: TeamGroupData[],
    dateColumns: CalendarCell[],
    sprintGroups: Record<string, SprintInfo>,
    accessToken: string,
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const { sheets } = this.initializeClients(accessToken);

    try {
      // Build spreadsheet structure
      const { values, requests } = this.buildSpreadsheetStructure(
        teamGroups,
        dateColumns,
        sprintGroups,
      );

      // Create spreadsheet
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
          },
          sheets: [
            {
              properties: {
                title: 'Leave Calendar',
                gridProperties: {
                  rowCount: values.length,
                  columnCount: 4 + dateColumns.length,
                },
              },
            },
          ],
        },
      });

      const spreadsheetId = createResponse.data.spreadsheetId;
      const spreadsheetUrl = createResponse.data.spreadsheetUrl;
      const sheetId = createResponse.data.sheets?.[0]?.properties?.sheetId;

      if (!spreadsheetId || !spreadsheetUrl || sheetId === undefined) {
        throw new InternalServerErrorException('Failed to create spreadsheet');
      }

      // Update all requests to use the actual sheet ID
      const updatedRequests = this.updateSheetIdInRequests(
        requests,
        sheetId || 0,
      );

      // Populate data using batchUpdate for values
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: [
            {
              range: 'Leave Calendar!A1',
              values,
            },
          ],
        },
      });

      // Apply styling using batchUpdate
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: updatedRequests,
        },
      });

      return { spreadsheetId, spreadsheetUrl };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create spreadsheet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update all sheetId references in requests to use the actual sheet ID
   */
  private updateSheetIdInRequests(requests: any[], sheetId: number): any[] {
    return requests.map((request) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (request.repeatCell?.range?.sheetId !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...request,
          repeatCell: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ...request.repeatCell,
            range: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              ...request.repeatCell.range,
              sheetId,
            },
          },
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (request.mergeCells?.range?.sheetId !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...request,
          mergeCells: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ...request.mergeCells,
            range: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              ...request.mergeCells.range,
              sheetId,
            },
          },
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (request.updateSheetProperties?.properties?.sheetId !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...request,
          updateSheetProperties: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ...request.updateSheetProperties,
            properties: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              ...request.updateSheetProperties.properties,
              sheetId,
            },
          },
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (request.updateDimensionProperties?.range?.sheetId !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return {
          ...request,
          updateDimensionProperties: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ...request.updateDimensionProperties,
            range: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              ...request.updateDimensionProperties.range,
              sheetId,
            },
          },
        };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return request;
    });
  }

  /**
   * Build complete spreadsheet structure with data and styling
   */
  private buildSpreadsheetStructure(
    teamGroups: TeamGroupData[],
    dateColumns: CalendarCell[],
    sprintGroups: Record<string, SprintInfo>,
  ): { values: any[][]; requests: any[] } {
    const values: any[][] = [];
    const requests: any[] = [];
    let currentRow = 0;

    // Build header row
    const headerRow = this.buildHeaderRow(dateColumns);
    values.push(headerRow);
    currentRow++;

    // Apply header row formatting
    const headerFormats = buildHeaderFormat(dateColumns);
    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 4 + dateColumns.length,
        },
        cell: {
          userEnteredFormat: headerFormats[0], // Apply first format to all
        },
        fields: 'userEnteredFormat',
      },
    });

    // Apply individual header cell formats
    headerFormats.forEach((format, index) => {
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: index,
            endColumnIndex: index + 1,
          },
          cell: {
            userEnteredFormat: format,
          },
          fields: 'userEnteredFormat',
        },
      });
    });

    // Build team rows
    teamGroups.forEach((teamGroup) => {
      const teamRowData = this.buildTeamRows(
        teamGroup,
        dateColumns,
        sprintGroups,
        currentRow,
      );

      values.push(...teamRowData.values);
      requests.push(...teamRowData.requests);
      currentRow += teamRowData.values.length;
    });

    // Add frozen panes
    requests.push(buildFreezeRequest());

    // Set column widths
    requests.push(buildColumnWidthRequest(0, 60)); // No
    requests.push(buildColumnWidthRequest(1, 150)); // Nama
    requests.push(buildColumnWidthRequest(2, 80)); // Jumlah
    requests.push(buildColumnWidthRequest(3, 180)); // Tanggal Cuti

    // Date columns
    for (let i = 0; i < dateColumns.length; i++) {
      requests.push(buildColumnWidthRequest(4 + i, 70));
    }

    // Set row heights
    requests.push(buildRowHeightRequest(0, 80)); // Header

    return { values, requests };
  }

  /**
   * Build header row with static columns and date columns
   */
  private buildHeaderRow(dateColumns: CalendarCell[]): any[] {
    const row = ['No', 'Nama', 'Jumlah', 'Tanggal Cuti'];

    dateColumns.forEach((cell) => {
      row.push(`${cell.dayNumber}\n${cell.dayName}`);
    });

    return row;
  }

  /**
   * Build team rows including team header, sprint cells, and member rows
   */
  private buildTeamRows(
    teamGroup: TeamGroupData,
    dateColumns: CalendarCell[],
    sprintGroups: Record<string, SprintInfo>,
    startRowIndex: number,
  ): { values: any[][]; requests: any[] } {
    const values: any[][] = [];
    const requests: any[] = [];
    let currentRow = startRowIndex;

    // Team header row
    const teamHeader = buildTeamHeaderFormat(
      currentRow,
      teamGroup.teamName,
      teamGroup.memberCount,
    );

    const teamHeaderRow = ['', teamHeader.value, '', ''];
    // Fill remaining cells with sprint info
    const sprintEntries = Object.entries(sprintGroups);
    let dateIndex = 0;

    sprintEntries.forEach(([sprintName, sprintInfo]) => {
      const sprintFormat = buildSprintCellFormat(
        currentRow,
        sprintName,
        4 + dateIndex,
        sprintInfo.dateCount,
      );

      requests.push(sprintFormat.mergeRequest);
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: currentRow,
            endRowIndex: currentRow + 1,
            startColumnIndex: 4 + dateIndex,
            endColumnIndex: 4 + dateIndex + 1,
          },
          cell: {
            userEnteredValue: { stringValue: sprintFormat.value },
            userEnteredFormat: sprintFormat.format,
          },
          fields: 'userEnteredValue,userEnteredFormat',
        },
      });

      dateIndex += sprintInfo.dateCount;
    });

    values.push(teamHeaderRow);
    requests.push(teamHeader.mergeRequest);
    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: currentRow,
          endRowIndex: currentRow + 1,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        cell: {
          userEnteredValue: { stringValue: teamHeader.value },
          userEnteredFormat: teamHeader.format,
        },
        fields: 'userEnteredValue,userEnteredFormat',
      },
    });

    requests.push(buildRowHeightRequest(currentRow, 60)); // Team header height
    currentRow++;

    // Member rows
    teamGroup.members.forEach((member, index) => {
      const memberRow = this.buildMemberRow(
        member,
        dateColumns,
        currentRow,
        index + 1, // Pass row number (1-based)
      );

      values.push(memberRow.values);
      requests.push(...memberRow.requests);
      requests.push(buildRowHeightRequest(currentRow, 40)); // Member row height
      currentRow++;
    });

    return { values, requests };
  }

  /**
   * Build a single member row with leave data
   */
  private buildMemberRow(
    member: any,
    dateColumns: CalendarCell[],
    rowIndex: number,
    rowNumber: number,
  ): { values: any[]; requests: any[] } {
    const requests: any[] = [];

    // Static columns

    const row = [
      rowNumber, // No - row number within team
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      member.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      member.leaveCount,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      member.dateRange,
    ];

    // Date columns
    dateColumns.forEach((cell, colIndex) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const isLeaveDate = member.leaveDates.includes(cell.date);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const status = member.leaveDatesWithStatus[cell.date];

      if (isLeaveDate) {
        row.push('✓');
      } else {
        row.push('');
      }

      // Apply cell formatting

      const format = buildLeaveDateCellFormat(cell, isLeaveDate, status);

      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: rowIndex,
            endRowIndex: rowIndex + 1,
            startColumnIndex: 4 + colIndex,
            endColumnIndex: 4 + colIndex + 1,
          },
          cell: {
            userEnteredFormat: format,
          },
          fields: 'userEnteredFormat',
        },
      });
    });

    // Apply static column formatting

    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        cell: {
          userEnteredFormat: buildMemberCellFormat('no'),
        },
        fields: 'userEnteredFormat',
      },
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        cell: {
          userEnteredFormat: buildMemberCellFormat('name'),
        },
        fields: 'userEnteredFormat',
      },
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        cell: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          userEnteredFormat: buildMemberCellFormat('count', member.leaveCount),
        },
        fields: 'userEnteredFormat',
      },
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: rowIndex,
          endRowIndex: rowIndex + 1,
          startColumnIndex: 3,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: buildMemberCellFormat('dateRange'),
        },
        fields: 'userEnteredFormat',
      },
    });

    return { values: row, requests };
  }
}
