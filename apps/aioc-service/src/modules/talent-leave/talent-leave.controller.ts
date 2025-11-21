import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { TalentLeaveService } from './talent-leave.service';
import {
  CreateTalentLeaveDto,
  UpdateTalentLeaveDto,
  TalentLeaveResponseDto,
} from './interfaces/talent-leave.dto';
import { TalentLeaveExportService } from './talent-leave-export.service';
import type {
  ExportTalentLeaveDto,
  ExportTalentLeaveResponseDto,
} from './interfaces/talent-leave-export.dto';
import type {
  GoogleAuthUrlResponseDto,
  GoogleAuthCallbackDto,
} from './interfaces/talent-leave-oauth.dto';
import { GoogleSheetsClient } from './clients/google-sheets.client';

@Controller('talent-leave')
export class TalentLeaveController {
  constructor(
    private readonly service: TalentLeaveService,
    private readonly exportService: TalentLeaveExportService,
    private readonly googleSheetsClient: GoogleSheetsClient,
  ) {}

  // SPECIFIC ROUTES FIRST - teams and talents endpoints must come before :id route
  @Get('teams')
  @HttpCode(HttpStatus.OK)
  async getTeams(): Promise<string[]> {
    return this.service.findAllTeams();
  }

  @Get('talents')
  @HttpCode(HttpStatus.OK)
  async getTalents(): Promise<
    Array<{
      id: string;
      name: string;
      team: string;
      role: string;
    }>
  > {
    return await this.service.findAllTalents();
  }

  @Get('auth/google')
  @HttpCode(HttpStatus.OK)
  getGoogleAuthUrl(): GoogleAuthUrlResponseDto {
    const oauth2Client = this.googleSheetsClient.getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
      prompt: 'consent',
    });

    return {
      authUrl,
      message:
        'Visit this URL to authorize the application. After authorization, you will receive an access token.',
    };
  }

  @Get('auth/google/callback')
  async googleAuthCallback(
    @Query() query: GoogleAuthCallbackDto,
    @Res() res: Response,
  ) {
    if (!query.code) {
      throw new BadRequestException('Authorization code is required');
    }

    const oauth2Client = this.googleSheetsClient.getOAuth2Client();

    try {
      const { tokens } = await oauth2Client.getToken(query.code);

      if (!tokens.access_token) {
        throw new BadRequestException('Failed to obtain access token');
      }

      // Return HTML page that sends token to parent window and closes
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Success</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                animation: fadeIn 0.5s ease-in;
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .checkmark {
                font-size: 64px;
                margin-bottom: 20px;
                animation: scaleIn 0.5s ease-out;
              }
              @keyframes scaleIn {
                from { transform: scale(0); }
                to { transform: scale(1); }
              }
              h1 { margin: 0; font-size: 24px; }
              p { margin: 10px 0 0 0; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="checkmark">✓</div>
              <h1>Authorization Successful!</h1>
              <p>Closing window and starting export...</p>
            </div>
            <script>
              // Send token to parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_SUCCESS',
                  accessToken: '${tokens.access_token}',
                  expiresIn: ${tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600}
                }, '*');
              }
              // Close window after a short delay
              setTimeout(() => {
                window.close();
              }, 1500);
            </script>
          </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } catch (error) {
      throw new BadRequestException(
        `Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 requests per hour
  async exportToSpreadsheet(
    @Body() dto: ExportTalentLeaveDto,
  ): Promise<ExportTalentLeaveResponseDto> {
    // Validate required fields
    if (!dto.startDate || dto.startDate.trim() === '') {
      throw new BadRequestException('startDate is required');
    }
    if (!dto.endDate || dto.endDate.trim() === '') {
      throw new BadRequestException('endDate is required');
    }
    if (!dto.accessToken || dto.accessToken.trim() === '') {
      throw new BadRequestException('accessToken is required');
    }

    // Validate date format (YYYY-MM-DD)
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(dto.startDate)) {
      throw new BadRequestException('startDate must be in YYYY-MM-DD format');
    }
    if (!dateFormatRegex.test(dto.endDate)) {
      throw new BadRequestException('endDate must be in YYYY-MM-DD format');
    }

    // Validate date range
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('startDate must be a valid date');
    }
    if (isNaN(endDate.getTime())) {
      throw new BadRequestException('endDate must be a valid date');
    }
    if (endDate < startDate) {
      throw new BadRequestException(
        'endDate must be after or equal to startDate',
      );
    }

    // Validate date range span (max 90 days)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 90) {
      throw new BadRequestException('date range cannot exceed 90 days');
    }

    // Call export service
    return this.exportService.exportToSpreadsheet(dto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTalentLeaveDto,
  ): Promise<TalentLeaveResponseDto> {
    // Validate required fields
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('name is required');
    }
    if (!dto.team || dto.team.trim() === '') {
      throw new BadRequestException('team is required');
    }
    if (!dto.role || dto.role.trim() === '') {
      throw new BadRequestException('role is required');
    }

    // Validate leaveDate if provided
    if (dto.leaveDate !== undefined) {
      if (!Array.isArray(dto.leaveDate)) {
        throw new BadRequestException('leaveDate must be an array');
      }

      // Validate each leave date range
      for (let i = 0; i < dto.leaveDate.length; i++) {
        const leave = dto.leaveDate[i];
        if (!leave.dateFrom) {
          throw new BadRequestException(`leaveDate[${i}].dateFrom is required`);
        }
        if (!leave.dateTo) {
          throw new BadRequestException(`leaveDate[${i}].dateTo is required`);
        }
        if (!leave.status || leave.status.trim() === '') {
          throw new BadRequestException(`leaveDate[${i}].status is required`);
        }

        // Validate timestamp formats
        if (!this.service.isValidTimestamp(leave.dateFrom)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateFrom must be a valid ISO 8601 timestamp`,
          );
        }
        if (!this.service.isValidTimestamp(leave.dateTo)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateTo must be a valid ISO 8601 timestamp`,
          );
        }

        // Validate date range
        if (!this.service.validateDateRange(leave.dateFrom, leave.dateTo)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateTo must be greater than or equal to dateFrom`,
          );
        }
      }
    }

    return this.service.create(dto);
  }

  @Get()
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('team') team?: string,
  ): Promise<TalentLeaveResponseDto[]> {
    const filters =
      startDate || endDate || status || team
        ? { startDate, endDate, status, team }
        : undefined;

    return this.service.findAll(filters);
  }

  // PARAMETERIZED ROUTES LAST - :id route must come after 'teams'
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TalentLeaveResponseDto> {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTalentLeaveDto,
  ): Promise<TalentLeaveResponseDto> {
    // Validate role if provided (cannot be empty string)
    if (dto.role !== undefined && dto.role.trim() === '') {
      throw new BadRequestException('role cannot be empty');
    }

    // Validate leaveDate array if provided
    if (dto.leaveDate !== undefined) {
      if (!Array.isArray(dto.leaveDate)) {
        throw new BadRequestException('leaveDate must be an array');
      }

      // Allow empty array (user can remove all leave dates)
      // Only validate if array has items
      for (let i = 0; i < dto.leaveDate.length; i++) {
        const leave = dto.leaveDate[i];
        if (!leave.dateFrom) {
          throw new BadRequestException(`leaveDate[${i}].dateFrom is required`);
        }
        if (!leave.dateTo) {
          throw new BadRequestException(`leaveDate[${i}].dateTo is required`);
        }
        if (!leave.status || leave.status.trim() === '') {
          throw new BadRequestException(`leaveDate[${i}].status is required`);
        }

        // Validate timestamp formats
        if (!this.service.isValidTimestamp(leave.dateFrom)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateFrom must be a valid ISO 8601 timestamp`,
          );
        }
        if (!this.service.isValidTimestamp(leave.dateTo)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateTo must be a valid ISO 8601 timestamp`,
          );
        }

        // Validate date range
        if (!this.service.validateDateRange(leave.dateFrom, leave.dateTo)) {
          throw new BadRequestException(
            `leaveDate[${i}].dateTo must be greater than or equal to dateFrom`,
          );
        }
      }
    }

    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
