import { Test, TestingModule } from '@nestjs/testing';
import { TalentLeaveModule } from './talent-leave.module';
import { TalentLeaveController } from './talent-leave.controller';
import { TalentLeaveService } from './talent-leave.service';
import { TalentLeaveRepository } from './repositories/talent-leave.repository';

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
      imports: [TalentLeaveModule],
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

  it('should compile without errors', async () => {
    await expect(
      Test.createTestingModule({
        imports: [TalentLeaveModule],
      }).compile(),
    ).resolves.toBeDefined();
  });
});
