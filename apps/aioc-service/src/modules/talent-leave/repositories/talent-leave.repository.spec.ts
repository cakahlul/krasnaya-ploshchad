import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { TalentLeaveRepository } from './talent-leave.repository';
import { TalentLeaveEntity } from '../interfaces/talent-leave.entity';
import { LeaveFilterDto } from '../interfaces/talent-leave.dto';

// Mock firebase-admin module
jest.mock('../../../firebase/firebase-admin', () => ({
  default: {
    firestore: jest.fn(),
  },
}));

describe('TalentLeaveRepository', () => {
  let repository: TalentLeaveRepository;
  let mockFirestore: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockQuery: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock Firestore document
    mockDoc = {
      id: 'test-id-123',
      data: jest.fn(),
      exists: true,
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Mock Firestore query
    mockQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    // Mock Firestore collection
    mockCollection = {
      add: jest.fn(),
      doc: jest.fn().mockReturnValue(mockDoc),
      get: jest.fn(),
      where: jest.fn().mockReturnValue(mockQuery),
      orderBy: jest.fn().mockReturnValue(mockQuery),
    };

    // Mock Firestore
    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    // Mock firebase-admin.firestore()
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const mockAdmin = require('../../../firebase/firebase-admin').default;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    mockAdmin.firestore.mockReturnValue(mockFirestore);

    const module: TestingModule = await Test.createTestingModule({
      providers: [TalentLeaveRepository],
    }).compile();

    repository = module.get<TalentLeaveRepository>(TalentLeaveRepository);
  });

  describe('create', () => {
    it('should create document in talent-leave collection with Date conversion', async () => {
      const entity: TalentLeaveEntity = {
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: new Date('2024-12-25T00:00:00Z'),
        dateTo: new Date('2024-12-27T23:59:59Z'),
        status: 'approved',
        createdAt: new Date('2024-11-10T10:00:00Z'),
        updatedAt: new Date('2024-11-10T10:00:00Z'),
      };

      const mockDocRef = {
        id: 'new-id-456',
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: 'new-id-456',
          data: () => ({ ...entity }),
        }),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockCollection.add.mockResolvedValue(mockDocRef);

      const result = await repository.create(entity);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockFirestore.collection).toHaveBeenCalledWith('talent-leave');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockCollection.add).toHaveBeenCalledWith(entity);
      expect(result.id).toBe('new-id-456');
    });

    it('should wrap Firestore errors in InternalServerErrorException', async () => {
      const entity: TalentLeaveEntity = {
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: new Date('2024-12-25T00:00:00Z'),
        dateTo: new Date('2024-12-27T23:59:59Z'),
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockCollection.add.mockRejectedValue(new Error('Firestore error'));

      await expect(repository.create(entity)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should retrieve all documents ordered by dateFrom ascending', async () => {
      const mockDocs = [
        {
          id: 'id-1',
          data: () => ({
            name: 'User 1',
            team: 'Engineering',
            dateFrom: { toDate: () => new Date('2024-12-25T00:00:00Z') },
            dateTo: { toDate: () => new Date('2024-12-27T23:59:59Z') },
            status: 'approved',
            createdAt: { toDate: () => new Date('2024-11-10T10:00:00Z') },
            updatedAt: { toDate: () => new Date('2024-11-10T10:00:00Z') },
          }),
        },
        {
          id: 'id-2',
          data: () => ({
            name: 'User 2',
            team: 'Marketing',
            dateFrom: { toDate: () => new Date('2024-12-26T00:00:00Z') },
            dateTo: { toDate: () => new Date('2024-12-28T23:59:59Z') },
            status: 'pending',
            createdAt: { toDate: () => new Date('2024-11-10T11:00:00Z') },
            updatedAt: { toDate: () => new Date('2024-11-10T11:00:00Z') },
          }),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockQuery.get.mockResolvedValue({ docs: mockDocs });

      const result = await repository.findAll();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockFirestore.collection).toHaveBeenCalledWith('talent-leave');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockCollection.orderBy).toHaveBeenCalledWith('dateFrom', 'asc');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('id-1');
      expect(result[0].name).toBe('User 1');
    });

    it('should return empty array when no documents exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockQuery.get.mockResolvedValue({ docs: [] });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should handle Firestore timestamp conversion to Date objects', async () => {
      const mockDocs = [
        {
          id: 'id-1',
          data: () => ({
            name: 'User 1',
            team: 'Engineering',
            dateFrom: { toDate: () => new Date('2024-12-25T00:00:00Z') },
            dateTo: { toDate: () => new Date('2024-12-27T23:59:59Z') },
            status: 'approved',
            createdAt: { toDate: () => new Date('2024-11-10T10:00:00Z') },
            updatedAt: { toDate: () => new Date('2024-11-10T10:00:00Z') },
          }),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockQuery.get.mockResolvedValue({ docs: mockDocs });

      const result = await repository.findAll();

      expect(result[0].dateFrom instanceof Date).toBe(true);
      expect(result[0].dateTo instanceof Date).toBe(true);
      expect(result[0].createdAt instanceof Date).toBe(true);
      expect(result[0].updatedAt instanceof Date).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return entity when document exists', async () => {
      const mockData = {
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: { toDate: () => new Date('2024-12-25T00:00:00Z') },
        dateTo: { toDate: () => new Date('2024-12-27T23:59:59Z') },
        status: 'approved',
        createdAt: { toDate: () => new Date('2024-11-10T10:00:00Z') },
        updatedAt: { toDate: () => new Date('2024-11-10T10:00:00Z') },
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockDoc.exists = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.data.mockReturnValue(mockData);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.get.mockResolvedValue(mockDoc);

      const result = await repository.findById('test-id-123');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockFirestore.collection).toHaveBeenCalledWith('talent-leave');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockCollection.doc).toHaveBeenCalledWith('test-id-123');
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id-123');
      expect(result?.name).toBe('John Doe');
    });

    it('should return null when document does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockDoc.exists = false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.get.mockResolvedValue(mockDoc);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should wrap Firestore errors in InternalServerErrorException', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.get.mockRejectedValue(new Error('Firestore error'));

      await expect(repository.findById('test-id-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    it('should update existing document with partial data', async () => {
      const partialData: Partial<TalentLeaveEntity> = {
        status: 'cancelled',
        updatedAt: new Date('2024-11-11T10:00:00Z'),
      };

      const mockUpdatedData = {
        name: 'John Doe',
        team: 'Engineering',
        dateFrom: { toDate: () => new Date('2024-12-25T00:00:00Z') },
        dateTo: { toDate: () => new Date('2024-12-27T23:59:59Z') },
        status: 'cancelled',
        createdAt: { toDate: () => new Date('2024-11-10T10:00:00Z') },
        updatedAt: { toDate: () => new Date('2024-11-11T10:00:00Z') },
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockDoc.exists = true;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.update.mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.get.mockResolvedValue(mockDoc);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.data.mockReturnValue(mockUpdatedData);

      const result = await repository.update('test-id-123', partialData);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockCollection.doc).toHaveBeenCalledWith('test-id-123');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockDoc.update).toHaveBeenCalledWith(partialData);
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id-123');
      expect(result?.status).toBe('cancelled');
    });

    it('should return null when document does not exist', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      mockDoc.exists = false;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.get.mockResolvedValue(mockDoc);

      const result = await repository.update('non-existent-id', {
        status: 'cancelled',
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete document from Firestore', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.delete.mockResolvedValue(undefined);

      await repository.delete('test-id-123');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockFirestore.collection).toHaveBeenCalledWith('talent-leave');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockCollection.doc).toHaveBeenCalledWith('test-id-123');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockDoc.delete).toHaveBeenCalled();
    });

    it('should wrap Firestore errors in InternalServerErrorException', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockDoc.delete.mockRejectedValue(new Error('Firestore error'));

      await expect(repository.delete('test-id-123')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll with filters', () => {
    it('should accept LeaveFilterDto parameter', async () => {
      const filters: LeaveFilterDto = {
        status: 'approved',
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockQuery.get.mockResolvedValue({ docs: [] });

      await repository.findAll(filters);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(mockCollection.where).toHaveBeenCalled();
    });
  });
});
