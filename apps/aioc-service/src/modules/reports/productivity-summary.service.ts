import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ProductivitySummaryResponseDto, ProductivitySummaryMemberDto } from './interfaces/productivity-summary.dto';
import { Level } from 'src/shared/enums/level.enum';
import { GoogleSheetsClient } from '../talent-leave/clients/google-sheets.client';

@Injectable()
export class ProductivitySummaryService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly googleSheetsClient: GoogleSheetsClient,
  ) {}

  private formatToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async generateProductivitySummary(month: number, year: number): Promise<ProductivitySummaryResponseDto> {
    // 1. Calculate startDate and endDate strings (YYYY-MM-DD)
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0); // Last day of the requested month

    const startDateStr = this.formatToYYYYMMDD(start);
    const endDateStr = this.formatToYYYYMMDD(end);

    // 2. Fetch reports for DS and SLS concurrently
    const [dsReport, slsReport] = await Promise.all([
      this.reportsService.generateReportByDateRange(startDateStr, endDateStr, 'DS'),
      this.reportsService.generateReportByDateRange(startDateStr, endDateStr, 'SLS'),
    ]);

    // 3. Process Member Details
    const details: ProductivitySummaryMemberDto[] = [];
    
    // Helper to process members from a report and attach the team
    const processTeamMembers = (reportData: any, teamName: string) => {
      const issues = reportData.issues || [];
      for (const issue of issues) {
        const wpProduct = issue.weightPointsProduct || 0;
        const wpTech = issue.weightPointsTechDebt || 0;
        const wpTotal = issue.totalWeightPoints || 0;
        const workingDays = issue.workingDays || 0;
        
        // As per requirement: Average WP = wpTotal / workingDays
        const averageWp = workingDays > 0 ? wpTotal / workingDays : 0;
        
        // Determine expected Average WP (target WP per day)
        // Usually target WP per day is calculated in service: targetWeightPoints / workingDays
        // The previous service defines junior=5.6, medior=6.8, senior/IC=8
        const targetWp = issue.targetWeightPoints || 0;
        const expectedAverageWp = workingDays > 0 ? targetWp / workingDays : 0;

        details.push({
          name: issue.member,
          team: teamName,
          wpProduct,
          wpTech,
          wpTotal,
          workingDays,
          averageWp,
          expectedAverageWp,
        });
      }
    };

    processTeamMembers(dsReport, 'DS');
    processTeamMembers(slsReport, 'SLS');

    // Sort details alphabetically by name
    details.sort((a, b) => a.name.localeCompare(b.name));

    // 4. Calculate Summary Stats
    const totalDaysOfWorks = details.reduce((sum, member) => sum + member.workingDays, 0);
    const totalWpExpected = details.reduce((sum, member) => sum + (member.expectedAverageWp * member.workingDays), 0);
    const averageWpExpected = totalDaysOfWorks > 0 ? (totalWpExpected / totalDaysOfWorks) : 0;
    const productivityExpected = averageWpExpected / 8;
    
    const totalWpProduced = details.reduce((sum, member) => sum + member.wpTotal, 0);
    const averageWpProduced = totalDaysOfWorks > 0 ? (totalWpProduced / totalDaysOfWorks) : 0;
    const productivityProduced = averageWpProduced / 8;

    const productivityProduceVsExpected = productivityExpected > 0 
      ? (productivityProduced - productivityExpected) / productivityExpected 
      : 0;

    const summary = {
      totalDaysOfWorks,
      totalWpExpected,
      averageWpExpected,
      productivityExpected,
      totalWpProduced,
      averageWpProduced,
      productivityProduced,
      productivityProduceVsExpected,
    };

    return {
      summary,
      details,
    };
  }

  async exportToSpreadsheet(month: number, year: number, accessToken: string) {
    try {
      // 1. Fetch the data using existing generateProductivitySummary logic
      const data = await this.generateProductivitySummary(month, year);
      
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[month - 1] || month.toString();
      const title = `Productivity Summary - ${monthName} ${year}`;

      // 2. Initialize Google Sheets client
      // Note: We need to bypass the public client methods or use the internal oauth2client to get raw "sheets"
      // Since GoogleSheetsClient doesn't expose a raw 'sheets' object publically that we can use, we have to cheat a bit.
      // Another option is to use the raw 'google' package
      
      const { google } = require('googleapis');
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      // 3. Build the spreadsheet rows
      const values: any[][] = [];
      const requests: any[] = [];

      // Add Top-level Summary Table
      values.push(['Productivity Summary', `${monthName} ${year}`, '', '', '', '', '', '']);
      values.push([]);
      
      // Summary Header
      values.push(['Metric', 'Value']);
      
      // Summary Data
      values.push(['Total Days of Works', data.summary.totalDaysOfWorks]);
      values.push(['Total WP Expected', data.summary.totalWpExpected.toFixed(2)]);
      values.push(['Average WP Expected', data.summary.averageWpExpected.toFixed(2)]);
      values.push(['Productivity Expected', `${(data.summary.productivityExpected * 100).toFixed(2)}%`]);
      values.push(['Total WP Produced', data.summary.totalWpProduced.toFixed(2)]);
      values.push(['Average WP Produced', data.summary.averageWpProduced.toFixed(2)]);
      values.push(['Productivity Produced', `${(data.summary.productivityProduced * 100).toFixed(2)}%`]);
      values.push(['Produce vs Expected', `${(data.summary.productivityProduceVsExpected * 100).toFixed(2)}%`]);
      values.push([]);
      values.push([]);

      // Detailed Member Table Header
      values.push([
        'Name',
        'Team',
        'Working Days',
        'WP Product',
        'WP Tech',
        'WP Total',
        'Avg WP / Day',
        'Expected Avg WP'
      ]);

      // Detailed Member Table Data
      data.details.forEach(member => {
        values.push([
          member.name,
          member.team,
          member.workingDays,
          member.wpProduct,
          member.wpTech,
          Number(member.wpTotal.toFixed(2)),
          Number(member.averageWp.toFixed(2)),
          Number(member.expectedAverageWp.toFixed(2))
        ]);
      });

      // Simple formatting requests
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: 0,
            gridProperties: {
              frozenRowCount: 13, // Freeze everything up to the details header
            },
            title: 'Summary',
          },
          fields: 'gridProperties.frozenRowCount,title',
        },
      });

      // Request formatting for Headers
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 2,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.4, green: 0.3, blue: 0.7 }, // Purple
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 14 },
              horizontalAlignment: 'CENTER',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      });

      requests.push({
        mergeCells: {
          range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 2 },
          mergeType: 'MERGE_ALL',
        },
      });
      
      // Bold Headers
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 2,
            endRowIndex: 3,
            startColumnIndex: 0,
            endColumnIndex: 2,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }, // Gray
              textFormat: { bold: true },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      });
      
      requests.push({
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 12,
            endRowIndex: 13,
            startColumnIndex: 0,
            endColumnIndex: 8,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }, // Gray
              textFormat: { bold: true },
              horizontalAlignment: 'CENTER',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      });

      // 4. Create and populate spreadsheet
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title },
          sheets: [
            {
              properties: {
                title: 'Summary',
                gridProperties: { rowCount: values.length + 10, columnCount: 10 },
              },
            },
          ],
        },
      });

      const spreadsheetId = createResponse.data.spreadsheetId;
      const spreadsheetUrl = createResponse.data.spreadsheetUrl;

      if (!spreadsheetId || !spreadsheetUrl) {
        throw new InternalServerErrorException('Failed to create spreadsheet');
      }

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [{ range: 'Summary!A1', values }],
        },
      });

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });

      // 5. Build response conforming to ExportResponse expectations
      return {
        success: true,
        message: 'Spreadsheet created successfully',
        spreadsheetTitle: title,
        spreadsheetUrl,
        dateRange: {
          startDate: `${year}-${String(month).padStart(2, '0')}-01`,
          endDate: `${year}-${String(month).padStart(2, '0')}-28`, // Approximate end date
        },
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to export Productivity Summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
