import crypto from 'crypto';
import { apiKeysRepository } from './api-keys.repository';
import type {
  ApiKeyEntity,
  ApiKeyResponse,
  CreateApiKeyResponse,
} from '@shared/types/api-key.types';

function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function generateRawKey(): string {
  return 'tere_' + crypto.randomBytes(16).toString('hex');
}

function toResponse(entity: ApiKeyEntity): ApiKeyResponse {
  return {
    id: entity.id!,
    name: entity.name,
    createdBy: entity.createdBy,
    createdAt: entity.createdAt.toISOString(),
    lastUsedAt: entity.lastUsedAt?.toISOString() ?? null,
    isActive: entity.isActive,
  };
}

class ApiKeysService {
  async create(name: string, creatorEmail: string): Promise<CreateApiKeyResponse> {
    const rawKey = generateRawKey();
    const hashedKey = hashKey(rawKey);

    const entity = await apiKeysRepository.create({
      name,
      hashedKey,
      createdBy: creatorEmail,
      createdAt: new Date(),
      lastUsedAt: null,
      isActive: true,
    });

    return {
      ...toResponse(entity),
      rawKey,
    };
  }

  async validateKey(rawKey: string): Promise<ApiKeyEntity | null> {
    if (!rawKey.startsWith('tere_')) return null;

    const hashedKey = hashKey(rawKey);
    const entity = await apiKeysRepository.findByHashedKey(hashedKey);
    if (!entity) return null;

    apiKeysRepository.update(entity.id!, { lastUsedAt: new Date() }).catch(() => {});

    return entity;
  }

  async findAll(): Promise<ApiKeyResponse[]> {
    const entities = await apiKeysRepository.findAll();
    return entities.map(toResponse);
  }

  async findByEmail(email: string): Promise<ApiKeyResponse[]> {
    const entities = await apiKeysRepository.findByEmail(email);
    return entities.map(toResponse);
  }

  async revoke(id: string, ownerEmail?: string): Promise<boolean> {
    const entity = await apiKeysRepository.findById(id);
    if (!entity) return false;
    if (ownerEmail && entity.createdBy !== ownerEmail) return false;
    await apiKeysRepository.update(id, { isActive: false });
    return true;
  }
}

export const apiKeysService = new ApiKeysService();
