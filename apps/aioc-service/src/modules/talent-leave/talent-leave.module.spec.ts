import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TalentLeaveModule } from './talent-leave.module';
import { TalentLeaveController } from './talent-leave.controller';
import { TalentLeaveService } from './talent-leave.service';
import { TalentLeaveRepository } from './repositories/talent-leave.repository';
import { TalentLeaveExportService } from './talent-leave-export.service';
import { GoogleSheetsClient } from './clients/google-sheets.client';

// Mock firebase-admin for testing
jest.mock('../../firebase/firebase-admin', () => ({
  default: {
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn(),
    }),
  },
}));

describe('TalentLeaveModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TalentLeaveModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should declare TalentLeaveController', () => {
    const controller = module.get<TalentLeaveController>(TalentLeaveController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(TalentLeaveController);
  });

  it('should provide TalentLeaveService', () => {
    const service = module.get<TalentLeaveService>(TalentLeaveService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(TalentLeaveService);
  });

  it('should provide TalentLeaveRepository', () => {
    const repository = module.get<TalentLeaveRepository>(TalentLeaveRepository);
    expect(repository).toBeDefined();
    expect(repository).toBeInstanceOf(TalentLeaveRepository);
  });

  it('should export TalentLeaveService', () => {
    const exportedService = module.get<TalentLeaveService>(TalentLeaveService);
    expect(exportedService).toBeDefined();
  });

  it('should provide TalentLeaveExportService', () => {
    const exportService = module.get<TalentLeaveExportService>(
      TalentLeaveExportService,
    );
    expect(exportService).toBeDefined();
    expect(exportService).toBeInstanceOf(TalentLeaveExportService);
  });

  it('should provide GoogleSheetsClient', () => {
    const googleSheetsClient =
      module.get<GoogleSheetsClient>(GoogleSheetsClient);
    expect(googleSheetsClient).toBeDefined();
    expect(googleSheetsClient).toBeInstanceOf(GoogleSheetsClient);
  });

  it('should import HttpModule', () => {
    // HttpModule is imported, verify by checking if module compiles
    // HttpModule provides HttpService which is injected into TalentLeaveExportService
    const exportService = module.get<TalentLeaveExportService>(
      TalentLeaveExportService,
    );
    expect(exportService).toBeDefined();
  });

  it('should compile without errors', async () => {
    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
          }),
          TalentLeaveModule,
        ],
      }).compile(),
    ).resolves.toBeDefined();
  });
});
